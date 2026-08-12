import { clearedSessionCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("return_to") || "/entrar";
  const returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/entrar";
  const headers = new Headers({ Location: new URL(returnTo, request.url).toString() });
  for (const cookie of clearedSessionCookies(request.url)) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}
