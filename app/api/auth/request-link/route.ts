import { ensureCoreDb, getD1, newId } from "@/db/runtime";
import { passwordRequestIsBlocked, recordPasswordRequest } from "@/lib/auth-security";
import { issuePasswordToken, passwordAccountState, sendPasswordAccessEmail } from "@/lib/password-access";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM || !process.env.AUTH_SESSION_SECRET) {
    return json({ error: "O envio de acesso ainda não foi configurado pela administradora." }, 503);
  }
  const body = await request.json().catch(() => ({})) as { email?: unknown };
  const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Informe um e-mail válido." }, 400);

  const db = getD1();
  await ensureCoreDb(db);
  if (await passwordRequestIsBlocked(db, request, email)) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
  await recordPasswordRequest(db, request, email);
  const state = await passwordAccountState(email, db);
  if (!state.eligible) return json({ ok: true });
  const recent = await db.prepare(`SELECT COUNT(*) AS total FROM auth_login_tokens WHERE lower(email)=? AND created_at>=?`).bind(email, new Date(Date.now() - 15 * 60_000).toISOString()).first<{ total: number }>();
  if (Number(recent?.total || 0) >= 5) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
  const purpose = state.hasPassword ? "reset" : "activation";
  const issued = await issuePasswordToken(db, email, purpose, request.url);
  try {
    await sendPasswordAccessEmail(email, purpose, issued.link, issued.tokenId);
    await db.prepare(`INSERT INTO funnel_events (id,event_type,user_id,email,metadata_json) VALUES (?,?,?,?,?)`).bind(newId("funnel"), purpose === "activation" ? "activation_requested" : "password_reset_requested", state.userId, email, JSON.stringify({ eligible: true })).run();
  } catch {
    return json({ error: "Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos." }, 502);
  }
  return json({ ok: true });
}
