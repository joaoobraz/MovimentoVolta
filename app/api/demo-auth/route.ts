import { createSignedSession, DEMO_SESSION_COOKIE, SESSION_COOKIE, sessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

function clearCookie(name: string, requestUrl: string) {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

export async function POST(request: Request) {
  if (process.env.DEMO_MODE !== "true") return new Response("Não encontrado", { status: 404 });
  const body = await request.json().catch(() => ({})) as { email?: unknown; password?: unknown };
  const suppliedEmail = String(body.email || "").trim().toLowerCase();
  const suppliedPassword = String(body.password || "");
  const demoEmail = (process.env.DEMO_EMAIL || "maria@demonstracao.com").trim().toLowerCase();
  const demoPassword = process.env.DEMO_PASSWORD || "Maria@Volta2026";
  const adminEmail = (process.env.DEMO_ADMIN_EMAIL || "admin@demo.volta").trim().toLowerCase();
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "Admin@Volta2026";
  const headers = new Headers({ "Cache-Control": "no-store" });

  if (suppliedEmail === adminEmail && suppliedPassword === adminPassword) {
    const signedSession = await createSignedSession({ id: "demo-admin", email: adminEmail, name: process.env.DEMO_ADMIN_NAME || "Administradora" });
    headers.append("Set-Cookie", clearCookie(DEMO_SESSION_COOKIE, request.url));
    headers.append("Set-Cookie", sessionCookie(signedSession, request.url));
    return Response.json({ ok: true, redirect: "/admin" }, { headers });
  }

  if (suppliedEmail !== demoEmail || suppliedPassword !== demoPassword) {
    return Response.json({ error: "E-mail ou senha de demonstração incorretos." }, { status: 401, headers });
  }
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  headers.append("Set-Cookie", clearCookie(SESSION_COOKIE, request.url));
  headers.append("Set-Cookie", `${DEMO_SESSION_COOKIE}=active; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${secure}`);
  return Response.json({ ok: true, redirect: "/app" }, { headers });
}
