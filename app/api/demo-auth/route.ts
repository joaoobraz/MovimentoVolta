export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.DEMO_MODE !== "true") return new Response("Não encontrado", { status: 404 });
  const form = await request.formData();
  const suppliedEmail = String(form.get("email") || "").trim().toLowerCase();
  const demoEmail = (process.env.DEMO_EMAIL || "teste@volta.local").toLowerCase();
  if (suppliedEmail !== demoEmail) return Response.redirect(new URL("/entrar?erro=email", request.url), 303);
  return new Response(null, { status: 303, headers: { Location: new URL("/app", request.url).toString(), "Set-Cookie": "volta-demo-session=active; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800" } });
}
