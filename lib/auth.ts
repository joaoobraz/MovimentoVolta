export type SessionIdentity = {
  id: string;
  email: string;
  name: string;
};

type SessionPayload = SessionIdentity & { exp: number };

export const SESSION_COOKIE = "volta_session";
export const DEMO_SESSION_COOKIE = "volta-demo-session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function cookieValue(cookieHeader: string, name: string) {
  const pair = cookieHeader.split(";").map(item => item.trim()).find(item => item.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : "";
}

function configuredDemoIdentity(): SessionIdentity {
  const email = (process.env.DEMO_EMAIL || "teste@volta.local").trim().toLowerCase();
  return { id: "demo-owner", email, name: process.env.DEMO_NAME || "Conta de teste" };
}

function sessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || "";
  if (secret.length < 32) throw new Error("AUTH_SESSION_SECRET precisa ter pelo menos 32 caracteres.");
  return secret;
}

async function signingKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function identityIdForEmail(email: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(email.trim().toLowerCase())));
  return `email-${Array.from(digest.slice(0, 16), byte => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function hashLoginToken(token: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(token)));
  return Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("");
}

export function createLoginToken() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function createSignedSession(identity: SessionIdentity) {
  const payload: SessionPayload = { ...identity, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(encodedPayload)));
  return `${encodedPayload}.${toBase64Url(signature)}`;
}

async function verifySignedSession(value: string): Promise<SessionIdentity | null> {
  const [encodedPayload, encodedSignature] = value.split(".");
  if (!encodedPayload || !encodedSignature) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      fromBase64Url(encodedSignature),
      encoder.encode(encodedPayload),
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as SessionPayload;
    if (!payload.id || !payload.email || !payload.name || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { id: payload.id, email: payload.email.toLowerCase(), name: payload.name };
  } catch {
    return null;
  }
}

export async function getSessionIdentityFromCookieHeader(cookieHeader: string): Promise<SessionIdentity | null> {
  if (process.env.DEMO_MODE === "true" && cookieValue(cookieHeader, DEMO_SESSION_COOKIE) === "active") {
    return configuredDemoIdentity();
  }
  const signedSession = cookieValue(cookieHeader, SESSION_COOKIE);
  return signedSession ? verifySignedSession(signedSession) : null;
}

export async function getSessionIdentityFromRequest(request: Request) {
  return getSessionIdentityFromCookieHeader(request.headers.get("cookie") || "");
}

export function sessionCookie(value: string, requestUrl: string) {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure}`;
}

export function clearedSessionCookies(requestUrl: string) {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return [SESSION_COOKIE, DEMO_SESSION_COOKIE].map(name => `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`);
}
