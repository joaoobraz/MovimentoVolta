import { ensureCoreDb, getD1, newId, sanitizeText } from "@/db/runtime";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function record(value: unknown): JsonRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}; }
function pick(...values: unknown[]) { return values.find(value => value !== undefined && value !== null && String(value).trim() !== ""); }
function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

async function validSignature(request: Request, gateway: string, raw: string) {
  if (gateway === "simulado" && process.env.DEMO_MODE === "true") return true;
  const secretName = `${gateway.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_WEBHOOK_SECRET`;
  const secret = process.env[secretName] || process.env.PAYMENT_WEBHOOK_SECRET;
  const supplied = request.headers.get("x-volta-signature")?.replace(/^sha256=/, "");
  if (!secret || !supplied) return false;
  return timingSafeEqual(supplied, await hmac(secret, raw));
}

export async function POST(request: Request, context: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await context.params;
  const allowed = ["hotmart", "kiwify", "stripe", "mercadopago", "simulado"];
  if (!allowed.includes(gateway)) return Response.json({ error: "Gateway não suportado." }, { status: 404 });
  const raw = await request.text();
  if (!await validSignature(request, gateway, raw)) return Response.json({ error: "Assinatura inválida." }, { status: 401 });
  const payload = JSON.parse(raw || "{}") as JsonRecord;
  const data = record(payload.data), customer = record(pick(payload.customer, data.customer)), buyer = record(pick(payload.buyer, data.buyer)), metadata = record(pick(payload.metadata, data.metadata));
  const externalId = sanitizeText(pick(payload.eventId, payload.event_id, payload.id, data.eventId, data.event_id, data.id), 180);
  const paymentId = sanitizeText(pick(payload.paymentId, payload.payment_id, data.paymentId, data.payment_id, data.id, externalId), 180);
  const eventType = sanitizeText(pick(payload.type, payload.event, payload.event_type, data.type, data.status), 100).toLowerCase();
  const statusValue = sanitizeText(pick(payload.status, data.status, eventType), 100).toLowerCase();
  const productId = sanitizeText(pick(payload.productId, payload.product_id, data.productId, data.product_id, metadata.productId, metadata.product_id), 40);
  const email = sanitizeText(pick(payload.email, payload.customer_email, data.email, customer.email, buyer.email), 160).toLowerCase();
  const amountCents = Math.max(0, Math.round(Number(pick(payload.amount_cents, data.amount_cents, payload.amount, data.amount, 0)) || 0));
  if (!externalId) return Response.json({ error: "Evento sem identificador." }, { status: 400 });
  const db = getD1();
  await ensureCoreDb(db);
  const exists = await db.prepare(`SELECT id,status FROM webhook_events WHERE gateway=? AND external_id=?`).bind(gateway, externalId).first();
  if (exists) return Response.json({ ok: true, idempotent: true });

  const approved = ["approved", "paid", "succeeded", "completed", "purchase_approved", "payment_intent.succeeded"].some(value => statusValue.includes(value) || eventType.includes(value));
  const reversed = ["refunded", "refund", "chargeback", "canceled", "cancelled", "payment_intent.canceled"].some(value => statusValue.includes(value) || eventType.includes(value));
  let processingStatus = "ignored";

  if (approved && productId && email) {
    const product = await db.prepare(`SELECT id,price_cents FROM products WHERE id=? AND status='active'`).bind(productId).first<{ id: string; price_cents: number }>();
    if (!product) return Response.json({ error: "Produto não reconhecido." }, { status: 400 });
    const purchaseId = newId("purchase");
    const user = await db.prepare(`SELECT id FROM users WHERE lower(email)=? AND deleted_at IS NULL`).bind(email).first<{ id: string }>();
    await db.prepare(`INSERT INTO purchases (id,user_id,product_id,gateway,gateway_event_id,amount_cents,status) VALUES (?,?,?,?,?,?,'approved') ON CONFLICT(gateway_event_id) DO UPDATE SET status='approved',updated_at=CURRENT_TIMESTAMP`).bind(purchaseId, user?.id || null, productId, gateway, paymentId, amountCents || product.price_cents).run();
    const saved = await db.prepare(`SELECT id FROM purchases WHERE gateway_event_id=?`).bind(paymentId).first<{ id: string }>();
    if (user) await db.prepare(`INSERT INTO user_access (id,user_id,product_id,purchase_id,status) VALUES (?,?,?,?,'active') ON CONFLICT(user_id,product_id) DO UPDATE SET purchase_id=excluded.purchase_id,status='active',updated_at=CURRENT_TIMESTAMP`).bind(newId("access"), user.id, productId, saved?.id || purchaseId).run();
    else await db.prepare(`INSERT INTO entitlement_claims (id,email,product_id,purchase_id,status) VALUES (?,?,?,?,'active') ON CONFLICT(email,product_id) DO UPDATE SET purchase_id=excluded.purchase_id,status='active',updated_at=CURRENT_TIMESTAMP`).bind(newId("claim"), email, productId, saved?.id || purchaseId).run();
    processingStatus = user ? "access_granted" : "claim_created";
  } else if (reversed && paymentId) {
    const purchase = await db.prepare(`SELECT id,user_id,product_id FROM purchases WHERE gateway=? AND gateway_event_id=?`).bind(gateway, paymentId).first<{ id: string; user_id: string | null; product_id: string }>();
    if (purchase) {
      await db.prepare(`UPDATE purchases SET status='refunded',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(purchase.id).run();
      if (purchase.user_id) await db.prepare(`UPDATE user_access SET status='revoked',updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND product_id=?`).bind(purchase.user_id, purchase.product_id).run();
      await db.prepare(`UPDATE entitlement_claims SET status='revoked',updated_at=CURRENT_TIMESTAMP WHERE purchase_id=?`).bind(purchase.id).run();
      processingStatus = "access_revoked";
    }
  }

  await db.prepare(`INSERT INTO webhook_events (id,gateway,external_id,event_type,payload_hash,status,processed_at) VALUES (?,?,?,?,?,?,?)`).bind(newId("webhook"), gateway, externalId, eventType || "unknown", await sha256(raw), processingStatus, new Date().toISOString()).run();
  return Response.json({ ok: true, status: processingStatus });
}
