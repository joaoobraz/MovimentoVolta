export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const target = new URL("/entrar", request.url);
  target.searchParams.set("erro", "link_antigo");
  return Response.redirect(target, 303);
}
