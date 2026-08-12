export type SessionIdentity = {
  id: string;
  email: string;
  name: string;
};

type SessionPayload = SessionIdentity & { exp: number };

export type PasswordCredential = {
  password_hash: string | null;
  password_salt: string | null;
  password_iterations: number | null;
};

export const SESSION_COOKIE = "volta_session";
export const DEMO_SESSION_COOKIE = "volta-demo-session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();
// Mantém o custo compatível com o limite de execução do Cloudflare Workers.
// O valor usado em cada conta fica salvo junto do hash, permitindo aumentos futuros.
export const PASSWORD_ITERATIONS = 100_000;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function cookieValue(cookieHeader: string, name: string) {
  const pair = cookieHeader.split(";").map(item => item.trim()).find(item => item.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : "";
}

function configuredDemoIdentity(): SessionIdentity {
  const email = (process.env.DEMO_EMAIL || "maria@demonstracao.com").trim().toLowerCase();
  return { id: "demo-maria", email, name: process.env.DEMO_NAME || "Maria" };
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

export function passwordPolicyError(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`;
  if (!/[a-z]/.test(password)) return "Inclua pelo menos uma letra minúscula.";
  if (!/[A-Z]/.test(password)) return "Inclua pelo menos uma letra maiúscula.";
  if (!/[0-9]/.test(password)) return "Inclua pelo menos um número.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Inclua pelo menos um caractere especial, como !, @ ou #.";
  return "";
}

export async function createPasswordCredential(password: string) {
  const error = passwordPolicyError(password);
  if (error) throw new Error(error);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  return {
    hash: toBase64Url(passwordHash),
    salt: toBase64Url(salt),
    iterations: PASSWORD_ITERATIONS,
  };
}

export async function verifyPassword(password: string, credential: PasswordCredential) {
  if (!credential.password_hash || !credential.password_salt || !credential.password_iterations) return false;
  if (password.length < 1 || password.length > PASSWORD_MAX_LENGTH) return false;
  try {
    const actual = await derivePasswordHash(password, fromBase64Url(credential.password_salt), credential.password_iterations);
    const expected = fromBase64Url(credential.password_hash);
    if (actual.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
    return difference === 0;
  } catch {
    return false;
  }
}

async function derivePasswordHash(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
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
