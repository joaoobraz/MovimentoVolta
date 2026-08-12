import { ensureCoreDb, getD1, newId } from "@/db/runtime";
import { createLoginToken, hashLoginToken } from "@/lib/auth";
import { emailFrame, sendEmail } from "@/lib/email";

export type PasswordPurpose = "activation" | "reset";

type AccountRow = { id: string; password_hash: string | null };

function isLocalOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch { return true; }
}

export function publicAppOrigin(requestUrl: string) {
  const requestOrigin = new URL(requestUrl).origin.replace(/\/$/, "");
  if (!isLocalOrigin(requestOrigin)) return requestOrigin;
  const configuredOrigin = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  return configuredOrigin || requestOrigin;
}

function configuredAccessEmails() {
  return new Set(`${process.env.ADMIN_EMAILS || ""},${process.env.TESTER_EMAILS || ""}`
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean));
}

export async function passwordAccountState(email: string, db = getD1()) {
  await ensureCoreDb(db);
  const normalized = email.trim().toLowerCase();
  const [user, claim] = await Promise.all([
    db.prepare(`SELECT id,password_hash FROM users WHERE lower(email)=? AND status='active' AND deleted_at IS NULL LIMIT 1`).bind(normalized).first<AccountRow>(),
    db.prepare(`SELECT id FROM entitlement_claims WHERE lower(email)=? AND status='active' LIMIT 1`).bind(normalized).first<{ id: string }>(),
  ]);
  return {
    eligible: Boolean(user || claim || configuredAccessEmails().has(normalized)),
    hasPassword: Boolean(user?.password_hash),
    userId: user?.id || null,
  };
}

export async function issuePasswordToken(db: D1Database, email: string, purpose: PasswordPurpose, requestUrl: string) {
  const normalized = email.trim().toLowerCase();
  const token = createLoginToken();
  const tokenHash = await hashLoginToken(token);
  const tokenId = newId("password");
  const expiresIn = purpose === "activation" ? 24 * 60 * 60_000 : 30 * 60_000;
  const expiresAt = new Date(Date.now() + expiresIn).toISOString();
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(`DELETE FROM auth_login_tokens WHERE expires_at<=? OR used_at IS NOT NULL`).bind(now),
    db.prepare(`UPDATE auth_login_tokens SET used_at=? WHERE lower(email)=? AND purpose=? AND used_at IS NULL`).bind(now, normalized, purpose),
    db.prepare(`INSERT INTO auth_login_tokens (id,email,token_hash,purpose,expires_at) VALUES (?,?,?,?,?)`).bind(tokenId, normalized, tokenHash, purpose, expiresAt),
  ]);
  const origin = publicAppOrigin(requestUrl);
  return { tokenId, link: `${origin}/ativar?token=${encodeURIComponent(token)}`, expiresAt };
}

export async function sendPasswordAccessEmail(email: string, purpose: PasswordPurpose, link: string, tokenId: string) {
  const activation = purpose === "activation";
  const title = activation ? "Crie sua senha de acesso." : "Redefina sua senha.";
  const body = activation
    ? "Sua compra foi confirmada. Crie uma senha pessoal para acessar seus produtos com segurança. Este link funciona uma única vez e expira em 24 horas."
    : "Recebemos um pedido para redefinir sua senha. Este link funciona uma única vez e expira em 30 minutos.";
  const result = await sendEmail({
    to: email,
    subject: activation ? "Ative sua conta | Movimento Volta Pra Você" : "Redefinição de senha | Movimento Volta Pra Você",
    html: emailFrame(title, body, activation ? "Criar minha senha" : "Redefinir minha senha", link),
    text: `${title}\n\n${body}\n\n${link}`,
    idempotencyKey: `volta-password-${purpose}-${tokenId}`,
  });
  if (!result.ok) throw new Error(result.error);
}
