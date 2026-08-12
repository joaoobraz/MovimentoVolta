import { ensureCoreDb, getD1, newId, sanitizeText } from "@/db/runtime";
import { createPasswordCredential, createSignedSession, hashLoginToken, identityIdForEmail, passwordPolicyError, sessionCookie } from "@/lib/auth";
import { passwordAccountState } from "@/lib/password-access";

export const dynamic = "force-dynamic";

type TokenRow = { id: string; email: string; purpose: "activation" | "reset" };
type UserRow = { id: string; email: string; name: string };
type ClaimRow = { id: string; product_id: string; purchase_id: string };
type QuizProfileRow = { profile_key: string | null; score: number | null; result_json: string | null };

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function POST(request: Request) {
  if (!process.env.AUTH_SESSION_SECRET) return json({ error: "O acesso ainda não foi configurado pela administradora." }, 503);
  const body = await request.json().catch(() => ({})) as { token?: unknown; password?: unknown; confirmation?: unknown; name?: unknown };
  const token = String(body.token || "");
  const password = String(body.password || "");
  const confirmation = String(body.confirmation || "");
  const requestedName = sanitizeText(body.name, 100);
  if (token.length < 30 || token.length > 200) return json({ error: "Este link de ativação é inválido." }, 400);
  if (password !== confirmation) return json({ error: "As duas senhas precisam ser iguais." }, 400);
  const policyError = passwordPolicyError(password);
  if (policyError) return json({ error: policyError }, 400);

  const db = getD1();
  await ensureCoreDb(db);
  const tokenHash = await hashLoginToken(token);
  const now = new Date().toISOString();
  const passwordToken = await db.prepare(`SELECT id,email,purpose FROM auth_login_tokens WHERE token_hash=? AND purpose IN ('activation','reset') AND used_at IS NULL AND expires_at>? LIMIT 1`).bind(tokenHash, now).first<TokenRow>();
  if (!passwordToken) return json({ error: "Este link expirou ou já foi utilizado. Solicite um novo link." }, 400);

  const state = await passwordAccountState(passwordToken.email, db);
  if (!state.eligible) return json({ error: "Não encontramos uma compra ativa para esta conta." }, 403);
  const credential = await createPasswordCredential(password);
  const consumed = await db.prepare(`UPDATE auth_login_tokens SET used_at=? WHERE id=? AND used_at IS NULL`).bind(now, passwordToken.id).run();
  if (!consumed.success || Number(consumed.meta.changes || 0) !== 1) return json({ error: "Este link já foi utilizado." }, 409);

  const email = passwordToken.email.trim().toLowerCase();
  let user = await db.prepare(`SELECT id,email,name FROM users WHERE lower(email)=? LIMIT 1`).bind(email).first<UserRow>();
  if (!user) {
    const id = await identityIdForEmail(email);
    const fallbackName = sanitizeText(email.split("@")[0].replace(/[._-]+/g, " "), 100) || "Participante";
    const name = requestedName || fallbackName;
    await db.prepare(`INSERT INTO users (id,email,name,role,status,password_hash,password_salt,password_iterations,password_set_at) VALUES (?,?,?,'member','active',?,?,?,?)`).bind(id, email, name, credential.hash, credential.salt, credential.iterations, now).run();
    user = { id, email, name };
  } else {
    const name = requestedName || user.name;
    await db.prepare(`UPDATE users SET name=?,password_hash=?,password_salt=?,password_iterations=?,password_set_at=?,status='active',deleted_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(name, credential.hash, credential.salt, credential.iterations, now, user.id).run();
    user = { ...user, name };
  }

  const [claims, latestQuiz] = await Promise.all([
    db.prepare(`SELECT id,product_id,purchase_id FROM entitlement_claims WHERE lower(email)=? AND status='active'`).bind(email).all<ClaimRow>(),
    db.prepare(`SELECT q.profile_key,q.score,q.result_json FROM quiz_attempts q JOIN leads l ON l.id=q.lead_id WHERE lower(l.email)=? AND q.status='completed' ORDER BY q.completed_at DESC LIMIT 1`).bind(email).first<QuizProfileRow>(),
  ]);
  const claimStatements = claims.results.flatMap(claim => [
    db.prepare(`INSERT INTO user_access (id,user_id,product_id,purchase_id,status) VALUES (?,?,?,?,'active') ON CONFLICT(user_id,product_id) DO UPDATE SET purchase_id=excluded.purchase_id,status='active',expires_at=NULL,updated_at=CURRENT_TIMESTAMP`).bind(newId("access"), user.id, claim.product_id, claim.purchase_id),
    db.prepare(`UPDATE purchases SET user_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(user.id, claim.purchase_id),
    db.prepare(`UPDATE entitlement_claims SET status='claimed',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(claim.id),
  ]);
  const profileStatements = latestQuiz ? [
    db.prepare(`INSERT INTO user_profiles (user_id,profile_key,score,result_json,desired_area,weight_area,available_minutes) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET profile_key=excluded.profile_key,score=excluded.score,result_json=excluded.result_json,desired_area=excluded.desired_area,weight_area=excluded.weight_area,available_minutes=excluded.available_minutes,updated_at=CURRENT_TIMESTAMP`).bind(
      user.id,
      latestQuiz.profile_key,
      latestQuiz.score,
      latestQuiz.result_json,
      (() => { try { return String(JSON.parse(latestQuiz.result_json || "{}").desired || ""); } catch { return ""; } })(),
      (() => { try { return String(JSON.parse(latestQuiz.result_json || "{}").weight || ""); } catch { return ""; } })(),
      (() => { try { return Number(JSON.parse(latestQuiz.result_json || "{}").availableMinutes || 15); } catch { return 15; } })(),
    ),
  ] : [];
  await db.batch([
    db.prepare(`UPDATE auth_login_tokens SET used_at=? WHERE lower(email)=? AND used_at IS NULL`).bind(now, email),
    db.prepare(`INSERT OR IGNORE INTO user_preferences (user_id) VALUES (?)`).bind(user.id),
    db.prepare(`INSERT INTO funnel_events (id,event_type,user_id,email,metadata_json) VALUES (?,?,?,?,?)`).bind(newId("funnel"), passwordToken.purpose === "activation" ? "account_activated" : "password_reset", user.id, email, JSON.stringify({ method: "password" })),
    ...claimStatements,
    ...profileStatements,
  ]);
  const signedSession = await createSignedSession({ id: user.id, email: user.email, name: user.name });
  return json({ ok: true, redirect: "/app" }, 200, { "Set-Cookie": sessionCookie(signedSession, request.url) });
}
