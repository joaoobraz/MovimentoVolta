import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE, getSessionIdentityFromCookieHeader, SESSION_COOKIE } from "@/lib/auth";

export async function getSessionUser() {
  const store = await cookies();
  const values = [SESSION_COOKIE, DEMO_SESSION_COOKIE]
    .map(name => store.get(name))
    .filter(Boolean)
    .map(cookie => `${cookie!.name}=${encodeURIComponent(cookie!.value)}`)
    .join("; ");
  return getSessionIdentityFromCookieHeader(values);
}

export async function requireSessionUser(returnTo = "/app") {
  const user = await getSessionUser();
  if (user) return user;
  redirect(`/entrar?return_to=${encodeURIComponent(returnTo)}`);
}
