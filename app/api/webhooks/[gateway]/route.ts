import { ensureCoreDb, getD1, newId, sanitizeText } from "@/db/runtime";
import { emailFrame, escapeHtml, sendEmail } from "@/lib/email";
import { issuePasswordToken, passwordAccountState } from "@/lib/password-access";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;
type ProductRow = { id: string; name: string; price_cents: number };

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
  if (gateway === "wiapy") {
    const secret = process.env.WIAPY_WEBHOOK_TOKEN || process.env.WIAPY_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;
    const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || new URL(request.url).searchParams.get("token")?.trim();
    return Boolean(secret && supplied && timingSafeEqual(supplied, secret));
  }
  const secretName = `${gateway.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_WEBHOOK_SECRET`;
  const secret = process.env[secretName] || process.env.PAYMENT_WEBHOOK_SECRET;
  const supplied = request.headers.get("x-volta-signature")?.replace(/^sha256=/, "");
  if (!secret || !supplied) return false;
  return timingSafeEqual(supplied, await hmac(secret, raw));
}

async function resolveProducts(db: D1Database, gateway: string, payload: JsonRecord, genericProductId: string) {
  if (gateway !== "wiapy") {
    if (!genericProductId) return [] as ProductRow[];
    const product = await db.prepare(`SELECT id,name,price_cents FROM products WHERE id=? AND status='active'`).bind(genericProductId).first<ProductRow>();
    return product ? [product] : [];
  }

  const data = record(payload.data);
  const checkout = record(pick(payload.checkout, data.checkout));
  const checkoutExternalId = sanitizeText(pick(payload.checkoutId, payload.checkout_id, data.checkoutId, data.checkout_id, checkout.id), 180).toLowerCase();
  const checkoutTitle = sanitizeText(pick(payload.checkoutName, payload.checkout_name, data.checkoutName, data.checkout_name, checkout.name, checkout.title), 180).toLowerCase();
  const completeCheckoutSignals = (process.env.WIAPY_COMPLETE_CHECKOUT_IDS || "")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  const normalizedPayload = JSON.stringify(payload).toLowerCase();
  const isCompleteCheckout = checkoutTitle.includes("plano volta completo")
    || completeCheckoutSignals.includes(checkoutExternalId)
    || completeCheckoutSignals.some(signal => normalizedPayload.includes(signal));
  if (isCompleteCheckout) {
    const complete = await db.prepare(`SELECT id,name,price_cents FROM products WHERE id='completo' AND status='active' LIMIT 1`).first<ProductRow>();
    if (complete) return [complete];
  }

  const webhookProducts = [
    ...(Array.isArray(payload.products) ? payload.products.map(record) : []),
    ...(Array.isArray(payload.items) ? payload.items.map(record) : []),
    ...(Array.isArray(data.products) ? data.products.map(record) : []),
    ...(Array.isArray(data.items) ? data.items.map(record) : []),
    record(payload.product),
    record(data.product),
  ].filter(item => Object.keys(item).length > 0);
  const matched = new Map<string, ProductRow>();
  for (const item of webhookProducts) {
    const externalId = sanitizeText(pick(item.id, item.productId, item.product_id, item.externalId, item.external_id), 180);
    const title = sanitizeText(pick(item.title, item.name, item.productName, item.product_name), 180);
    const product = await db.prepare(`SELECT id,name,price_cents FROM products WHERE status='active' AND ((external_product_id IS NOT NULL AND external_product_id=?) OR lower(name)=lower(?)) LIMIT 1`).bind(externalId, title).first<ProductRow>();
    if (product) matched.set(product.id, product);
  }
  if (matched.size) return [...matched.values()];

  // A Wiapy pode variar o formato do payload entre checkout principal,
  // order bump e upsell. O mapa por checkout funciona somente como fallback:
  // quando a lista de produtos vem no evento, ela sempre tem prioridade.
  const checkoutProductMap = (process.env.WIAPY_CHECKOUT_PRODUCT_MAP || "")
    .split(",")
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => {
      const separator = entry.lastIndexOf(":");
      return separator > 0
        ? [entry.slice(0, separator).trim().toLowerCase(), entry.slice(separator + 1).trim().toLowerCase()] as const
        : null;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry?.[0] && entry?.[1]));
  const mapped = checkoutProductMap.find(([signal]) => checkoutExternalId === signal || normalizedPayload.includes(signal));
  if (!mapped) return [] as ProductRow[];
  const fallbackProduct = await db.prepare(`SELECT id,name,price_cents FROM products WHERE id=? AND status='active' LIMIT 1`).bind(mapped[1]).first<ProductRow>();
  return fallbackProduct ? [fallbackProduct] : [];
}

async function grantProduct(db: D1Database, gateway: string, paymentId: string, email: string, amountCents: number, product: ProductRow) {
  const gatewayEventId = gateway === "wiapy" ? `${paymentId}:${product.id}` : paymentId;
  const purchaseId = newId("purchase");
  const user = await db.prepare(`SELECT id FROM users WHERE lower(email)=? AND deleted_at IS NULL`).bind(email).first<{ id: string }>();
  await db.prepare(`INSERT INTO purchases (id,user_id,product_id,gateway,gateway_event_id,amount_cents,status) VALUES (?,?,?,?,?,?,'approved') ON CONFLICT(gateway_event_id) DO UPDATE SET user_id=COALESCE(excluded.user_id,purchases.user_id),status='approved',updated_at=CURRENT_TIMESTAMP`).bind(purchaseId, user?.id || null, product.id, gateway, gatewayEventId, amountCents || product.price_cents).run();
  const saved = await db.prepare(`SELECT id FROM purchases WHERE gateway_event_id=?`).bind(gatewayEventId).first<{ id: string }>();
  const savedId = saved?.id || purchaseId;
  const entitlements = product.id === "completo" ? ["completo", "mapa", "sos", "desafio"] : [product.id];
  const statements = entitlements.map(entitlement => user
    ? db.prepare(`INSERT INTO user_access (id,user_id,product_id,purchase_id,status) VALUES (?,?,?,?,'active') ON CONFLICT(user_id,product_id) DO UPDATE SET purchase_id=excluded.purchase_id,status='active',expires_at=NULL,updated_at=CURRENT_TIMESTAMP`).bind(newId("access"), user.id, entitlement, savedId)
    : db.prepare(`INSERT INTO entitlement_claims (id,email,product_id,purchase_id,status) VALUES (?,?,?,?,'active') ON CONFLICT(email,product_id) DO UPDATE SET purchase_id=excluded.purchase_id,status='active',updated_at=CURRENT_TIMESTAMP`).bind(newId("claim"), email, entitlement, savedId));
  if (statements.length) await db.batch(statements);
  return Boolean(user);
}

export async function POST(request: Request, context: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await context.params;
  const allowed = ["wiapy", "hotmart", "kiwify", "stripe", "mercadopago", "simulado"];
  if (!allowed.includes(gateway)) return Response.json({ error: "Gateway não suportado." }, { status: 404 });
  const raw = await request.text();
  if (!await validSignature(request, gateway, raw)) return Response.json({ error: "Assinatura inválida." }, { status: 401 });

  let payload: JsonRecord;
  try { payload = JSON.parse(raw || "{}") as JsonRecord; }
  catch { return Response.json({ error: "JSON inválido." }, { status: 400 }); }

  const data = record(payload.data);
  const payment = gateway === "wiapy" ? record(payload.payment) : data;
  const customer = record(pick(payload.customer, data.customer));
  const buyer = record(pick(payload.buyer, data.buyer));
  const metadata = record(pick(payload.metadata, data.metadata));
  const paymentId = sanitizeText(pick(payment.id, payload.paymentId, payload.payment_id, data.paymentId, data.payment_id, data.id, payload.id), 180);
  const eventType = sanitizeText(pick(payment.type, payload.type, payload.event, payload.event_type, data.type, data.status), 100).toLowerCase();
  const statusValue = sanitizeText(pick(payment.status, payload.status, data.status, eventType), 100).toLowerCase();
  const rawExternalId = sanitizeText(pick(payload.eventId, payload.event_id, paymentId), 180);
  const externalId = gateway === "wiapy" ? `${paymentId}:${statusValue || eventType}` : rawExternalId;
  const genericProductId = sanitizeText(pick(payload.productId, payload.product_id, data.productId, data.product_id, metadata.productId, metadata.product_id), 40);
  const email = sanitizeText(pick(payload.email, payload.customer_email, data.email, customer.email, buyer.email), 160).toLowerCase();
  const amountCents = Math.max(0, Math.round(Number(pick(payment.amount, payload.amount_cents, data.amount_cents, payload.amount, data.amount, 0)) || 0));
  if (!externalId || !paymentId) return Response.json({ error: "Evento sem identificador." }, { status: 400 });

  const db = getD1();
  await ensureCoreDb(db);
  const exists = await db.prepare(`SELECT id FROM webhook_events WHERE gateway=? AND external_id=?`).bind(gateway, externalId).first();
  if (exists) return Response.json({ ok: true, idempotent: true });

  const approved = ["approved", "paid", "succeeded", "completed", "purchase_approved", "payment_intent.succeeded"].some(value => statusValue.includes(value) || eventType.includes(value));
  const reversed = ["refunded", "refund", "chargedback", "chargeback", "canceled", "cancelled", "payment_intent.canceled"].some(value => statusValue.includes(value) || eventType.includes(value));
  let processingStatus = "ignored";

  if (approved && email) {
    const products = await resolveProducts(db, gateway, payload, genericProductId);
    if (!products.length) return Response.json({ error: gateway === "wiapy" ? "Produto da Wiapy ainda não vinculado no painel." : "Produto não reconhecido." }, { status: 422 });
    let linkedToAccount = false;
    for (const product of products) linkedToAccount = await grantProduct(db, gateway, paymentId, email, products.length === 1 ? amountCents : product.price_cents, product) || linkedToAccount;
    await db.prepare(`INSERT INTO funnel_events (id,event_type,user_id,email,product_id,metadata_json) VALUES (?,'purchase_approved',(SELECT id FROM users WHERE lower(email)=? LIMIT 1),?,?,?)`).bind(newId("funnel"), email, email, products.map(product => product.id).join("+"), JSON.stringify({ gateway, paymentMethod: sanitizeText(payment.method, 40) })).run();
    const productNames = products.map(product => product.name).join(", ");
    const accountState = await passwordAccountState(email, db);
    const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
    const issued = accountState.hasPassword ? null : await issuePasswordToken(db, email, "activation", request.url);
    const accessUrl = issued?.link || `${origin}/entrar?email=${encodeURIComponent(email)}`;
    const subject = accountState.hasPassword
      ? "Pagamento aprovado | seu produto já está disponível"
      : "Pagamento aprovado | crie sua senha de acesso";
    const message = accountState.hasPassword
      ? `Seu acesso a <strong>${escapeHtml(productNames)}</strong> já está disponível na sua conta. Entre com seu e-mail e a senha que você criou.`
      : `Seu acesso a <strong>${escapeHtml(productNames)}</strong> foi liberado. Para proteger sua conta, crie agora uma senha pessoal. Este link funciona uma única vez e expira em 24 horas.`;
    const delivery = await sendEmail({
      to: email,
      subject,
      html: emailFrame("Sua compra foi aprovada.", message, accountState.hasPassword ? "Entrar na minha conta" : "Criar minha senha", accessUrl),
      text: accountState.hasPassword
        ? `Sua compra foi aprovada. Produtos liberados: ${productNames}. Entre com seu e-mail e senha: ${accessUrl}`
        : `Sua compra foi aprovada. Produtos liberados: ${productNames}. Crie sua senha em até 24 horas: ${accessUrl}`,
      idempotencyKey: `volta-purchase-${gateway}-${paymentId}`,
    });
    if (!delivery.ok) await db.prepare(`INSERT INTO notification_outbox (id,channel,kind,recipient,payload_json,status) VALUES (?,'email','purchase_access',?,?, 'pending')`).bind(newId("notify"), email, JSON.stringify({ paymentId, products: products.map(product => product.id), accessUrl, activationRequired: !accountState.hasPassword, lastError: delivery.error })).run();
    processingStatus = linkedToAccount ? "access_granted" : "claim_created";
  } else if (reversed) {
    const purchases = gateway === "wiapy"
      ? await db.prepare(`SELECT id,user_id,product_id FROM purchases WHERE gateway=? AND gateway_event_id LIKE ?`).bind(gateway, `${paymentId}:%`).all<{ id: string; user_id: string | null; product_id: string }>()
      : await db.prepare(`SELECT id,user_id,product_id FROM purchases WHERE gateway=? AND gateway_event_id=?`).bind(gateway, paymentId).all<{ id: string; user_id: string | null; product_id: string }>();
    for (const purchase of purchases.results) {
      await db.prepare(`UPDATE purchases SET status='refunded',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(purchase.id).run();
      if (purchase.user_id) await db.prepare(`UPDATE user_access SET status='revoked',updated_at=CURRENT_TIMESTAMP WHERE purchase_id=?`).bind(purchase.id).run();
      await db.prepare(`UPDATE entitlement_claims SET status='revoked',updated_at=CURRENT_TIMESTAMP WHERE purchase_id=?`).bind(purchase.id).run();
    }
    if (purchases.results.length) processingStatus = "access_revoked";
  }

  await db.prepare(`INSERT INTO webhook_events (id,gateway,external_id,event_type,payload_hash,status,processed_at) VALUES (?,?,?,?,?,?,?)`).bind(newId("webhook"), gateway, externalId, eventType || statusValue || "unknown", await sha256(raw), processingStatus, new Date().toISOString()).run();
  return Response.json({ ok: true, status: processingStatus });
}
