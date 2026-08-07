import { ensureCoreDb, getD1, newId, sanitizeText } from "@/db/runtime";

export const dynamic = "force-dynamic";

async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

export async function POST(request: Request, context: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await context.params;
  const allowed = ["hotmart","kiwify","stripe","mercadopago","simulado"];
  if (!allowed.includes(gateway)) return Response.json({error:"Gateway não suportado."},{status:404});
  const raw = await request.text();
  const signature = request.headers.get("x-volta-signature");
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (gateway !== "simulado" && (!secret || !signature || signature !== await sha256(`${secret}.${raw}`))) return Response.json({error:"Assinatura inválida."},{status:401});
  const payload = JSON.parse(raw || "{}") as Record<string,unknown>;
  const externalId = sanitizeText(payload.id ?? payload.eventId,180);
  if (!externalId) return Response.json({error:"Evento sem identificador."},{status:400});
  const db = getD1(); await ensureCoreDb(db);
  const exists = await db.prepare(`SELECT id,status FROM webhook_events WHERE gateway=? AND external_id=?`).bind(gateway,externalId).first();
  if (exists) return Response.json({ok:true,idempotent:true});
  await db.prepare(`INSERT INTO webhook_events (id,gateway,external_id,event_type,payload_hash,status,processed_at) VALUES (?,?,?,?,?,'logged',?)`).bind(newId("webhook"),gateway,externalId,sanitizeText(payload.type,100)||"unknown",await sha256(raw),new Date().toISOString()).run();
  return Response.json({ok:true,received:true});
}
