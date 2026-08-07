import { ensureCoreDb, getD1, newId } from "@/db/runtime";
import { createLoginToken, hashLoginToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type DbRow = Record<string, unknown>;
const attempts = new Map<string, { count: number; resetAt: number }>();

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function isRateLimited(request: Request, email: string) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local";
  const key = `${ip}:${email}`;
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 5;
}

function configuredAccessEmails() {
  return new Set(`${process.env.ADMIN_EMAILS || ""},${process.env.TESTER_EMAILS || ""}`
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean));
}

function emailTemplate(link: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f5eee7;font-family:Arial,sans-serif;color:#44252b"><div style="max-width:560px;margin:32px auto;padding:32px;background:#fff;border-radius:20px"><p style="color:#a64d3b;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Movimento Volta Pra Você</p><h1 style="font-family:Georgia,serif;color:#6f1833">Seu acesso está pronto.</h1><p>Use o botão abaixo para entrar no seu espaço. Este link é pessoal, funciona uma única vez e expira em 15 minutos.</p><p style="margin:28px 0"><a href="${link}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#7d1d3e;color:#fff;text-decoration:none;font-weight:700">Entrar no meu espaço</a></p><p style="font-size:13px;color:#775f63">Se você não solicitou este acesso, ignore esta mensagem.</p></div></body></html>`;
}

async function sendAccessEmail(email: string, link: string, tokenId: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `volta-access-${tokenId}`,
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM,
      to: [email],
      subject: "Seu link de acesso — Movimento Volta Pra Você",
      html: emailTemplate(link),
      text: `Seu acesso ao Movimento Volta Pra Você: ${link}\n\nO link expira em 15 minutos e funciona uma única vez.`,
    }),
  });
  if (!response.ok) throw new Error(`Falha no provedor de e-mail (${response.status}).`);
}

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM || !process.env.AUTH_SESSION_SECRET) {
    return json({ error: "O envio de acesso ainda não foi configurado pela administradora." }, 503);
  }

  const body = await request.json().catch(() => ({})) as { email?: unknown };
  const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Informe um e-mail válido." }, 400);
  if (isRateLimited(request, email)) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);

  const db = getD1();
  await ensureCoreDb(db);
  const [user, claim] = await Promise.all([
    db.prepare(`SELECT id FROM users WHERE lower(email)=? AND status='active' AND deleted_at IS NULL LIMIT 1`).bind(email).first<DbRow>(),
    db.prepare(`SELECT id FROM entitlement_claims WHERE lower(email)=? AND status='active' LIMIT 1`).bind(email).first<DbRow>(),
  ]);
  const eligible = Boolean(user || claim || configuredAccessEmails().has(email));
  if (!eligible) return json({ ok: true });

  const token = createLoginToken();
  const tokenHash = await hashLoginToken(token);
  const tokenId = newId("login");
  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
  await db.batch([
    db.prepare(`DELETE FROM auth_login_tokens WHERE expires_at<=? OR used_at IS NOT NULL`).bind(new Date().toISOString()),
    db.prepare(`INSERT INTO auth_login_tokens (id,email,token_hash,expires_at) VALUES (?,?,?,?)`).bind(tokenId, email, tokenHash, expiresAt),
  ]);

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const link = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  try {
    await sendAccessEmail(email, link, tokenId);
  } catch {
    return json({ error: "Não foi possível enviar o link agora. Tente novamente em alguns minutos." }, 502);
  }
  return json({ ok: true });
}
