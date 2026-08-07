import { clearedSessionCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const headers = new Headers({ Location: new URL("/entrar", request.url).toString() });
  for (const cookie of clearedSessionCookies(request.url)) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}
