import { newId } from "@/db/runtime";

const encoder = new TextEncoder();
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_MAX_FAILURES = 5;

async function sha256(value: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function attemptKeys(request: Request, email: string) {
  const ip = (request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local")
    .split(",")[0]
    .trim();
  return Promise.all([sha256(email.trim().toLowerCase()), sha256(ip)]).then(([emailHash, ipHash]) => ({ emailHash, ipHash }));
}

export async function loginIsBlocked(db: D1Database, request: Request, email: string) {
  const { emailHash, ipHash } = await attemptKeys(request, email);
  const since = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();
  const row = await db.prepare(`SELECT COUNT(*) AS total FROM auth_login_attempts WHERE success=0 AND created_at>=? AND (email_hash=? OR ip_hash=?)`).bind(since, emailHash, ipHash).first<{ total: number }>();
  return Number(row?.total || 0) >= LOGIN_MAX_FAILURES;
}

export async function recordLoginAttempt(db: D1Database, request: Request, email: string, success: boolean) {
  const { emailHash, ipHash } = await attemptKeys(request, email);
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    db.prepare(`DELETE FROM auth_login_attempts WHERE created_at<?`).bind(new Date(Date.now() - 24 * 60 * 60_000).toISOString()),
  ];
  if (success) {
    statements.push(db.prepare(`DELETE FROM auth_login_attempts WHERE success=0 AND (email_hash=? OR ip_hash=?)`).bind(emailHash, ipHash));
  }
  statements.push(db.prepare(`INSERT INTO auth_login_attempts (id,email_hash,ip_hash,success,created_at) VALUES (?,?,?,?,?)`).bind(newId("attempt"), emailHash, ipHash, success ? 1 : 0, now));
  await db.batch(statements);
}

export async function passwordRequestIsBlocked(db: D1Database, request: Request, email: string) {
  const { emailHash, ipHash } = await attemptKeys(request, email);
  const since = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();
  const row = await db.prepare(`SELECT COUNT(*) AS total FROM auth_login_attempts WHERE id LIKE 'password-request_%' AND created_at>=? AND (email_hash=? OR ip_hash=?)`).bind(since, emailHash, ipHash).first<{ total: number }>();
  return Number(row?.total || 0) >= LOGIN_MAX_FAILURES;
}

export async function recordPasswordRequest(db: D1Database, request: Request, email: string) {
  const { emailHash, ipHash } = await attemptKeys(request, email);
  await db.batch([
    db.prepare(`DELETE FROM auth_login_attempts WHERE id LIKE 'password-request_%' AND created_at<?`).bind(new Date(Date.now() - 24 * 60 * 60_000).toISOString()),
    db.prepare(`INSERT INTO auth_login_attempts (id,email_hash,ip_hash,success,created_at) VALUES (?,?,?,?,?)`).bind(newId("password-request"), emailHash, ipHash, 1, new Date().toISOString()),
  ]);
}
