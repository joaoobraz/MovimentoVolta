import { ensureCoreDb, getD1, newId } from "@/db/runtime";
import { createSignedSession, sessionCookie, verifyPassword, type PasswordCredential } from "@/lib/auth";
import { loginIsBlocked, recordLoginAttempt } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

type UserRow = PasswordCredential & { id: string; email: string; name: string };

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function POST(request: Request) {
  if (!process.env.AUTH_SESSION_SECRET) return json({ error: "O acesso ainda não foi configurado pela administradora." }, 503);
  const body = await request.json().catch(() => ({})) as { email?: unknown; password?: unknown };
  const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
  const password = String(body.password || "");
  if (!/^\S+@\S+\.\S+$/.test(email) || !password || password.length > 128) {
    return json({ error: "Revise o e-mail e a senha." }, 400);
  }

  const db = getD1();
  await ensureCoreDb(db);
  if (await loginIsBlocked(db, request, email)) {
    return json({ error: "Muitas tentativas. Aguarde 15 minutos ou redefina sua senha." }, 429);
  }

  const user = await db.prepare(`SELECT id,email,name,password_hash,password_salt,password_iterations FROM users WHERE lower(email)=? AND status='active' AND deleted_at IS NULL LIMIT 1`).bind(email).first<UserRow>();
  if (!user?.password_hash) {
    await recordLoginAttempt(db, request, email, false);
    return json({ error: "Esta conta ainda precisa ser ativada. Use “Criar ou recuperar senha”.", activationRequired: true }, 401);
  }
  if (!await verifyPassword(password, user)) {
    await recordLoginAttempt(db, request, email, false);
    return json({ error: "E-mail ou senha incorretos." }, 401);
  }

  await recordLoginAttempt(db, request, email, true);
  await db.prepare(`INSERT INTO funnel_events (id,event_type,user_id,email,metadata_json) VALUES (?,'login_completed',?,?,?)`).bind(newId("funnel"), user.id, email, JSON.stringify({ method: "password" })).run();
  const signedSession = await createSignedSession({ id: user.id, email: user.email, name: user.name });
  return json({ ok: true, redirect: "/app" }, 200, { "Set-Cookie": sessionCookie(signedSession, request.url) });
}
