import { ensureCoreDb, getD1, newId, sanitizeText } from "@/db/runtime";
import { createSignedSession, hashLoginToken, identityIdForEmail, sessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

type TokenRow = { id: string; email: string };
type UserRow = { id: string; email: string; name: string };

function loginRedirect(request: Request, error?: string) {
  const target = new URL("/entrar", request.url);
  if (error) target.searchParams.set("erro", error);
  return Response.redirect(target, 303);
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (token.length < 30 || token.length > 200) return loginRedirect(request, "link");

  const db = getD1();
  await ensureCoreDb(db);
  const tokenHash = await hashLoginToken(token);
  const now = new Date().toISOString();
  const loginToken = await db.prepare(`SELECT id,email FROM auth_login_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>? LIMIT 1`).bind(tokenHash, now).first<TokenRow>();
  if (!loginToken) return loginRedirect(request, "link");

  const update = await db.prepare(`UPDATE auth_login_tokens SET used_at=? WHERE id=? AND used_at IS NULL`).bind(now, loginToken.id).run();
  if (!update.success || Number(update.meta.changes || 0) !== 1) return loginRedirect(request, "link");

  const email = loginToken.email.trim().toLowerCase();
  let user = await db.prepare(`SELECT id,email,name FROM users WHERE lower(email)=? AND deleted_at IS NULL LIMIT 1`).bind(email).first<UserRow>();
  if (!user) {
    const id = await identityIdForEmail(email);
    const name = sanitizeText(email.split("@")[0].replace(/[._-]+/g, " "), 100) || "Participante";
    await db.prepare(`INSERT INTO users (id,email,name,role,status) VALUES (?,?,?,'member','active')`).bind(id, email, name).run();
    user = { id, email, name };
  }

  try {
    await db.prepare(`INSERT INTO funnel_events (id,event_type,user_id,email,metadata_json) VALUES (?,'login_completed',?,?,?)`).bind(newId("funnel"), user.id, email, JSON.stringify({ method: "magic_link" })).run();
    const signedSession = await createSignedSession({ id: user.id, email: user.email, name: user.name });
    return new Response(null, {
      status: 303,
      headers: { Location: new URL("/app", request.url).toString(), "Set-Cookie": sessionCookie(signedSession, request.url) },
    });
  } catch {
    return loginRedirect(request, "configuracao");
  }
}
