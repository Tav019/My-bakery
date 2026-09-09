/**
 * Sesión compartida basada en una cookie firmada (HMAC-SHA256), sin tabla
 * de usuarios ni Supabase Auth. Implementado con Web Crypto para poder
 * correr tanto en Server Actions/Route Handlers (Node) como en el
 * middleware (Edge runtime).
 */

export const COOKIE_NAME = "session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 días

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.APP_PASSWORD;
  if (!secret) {
    throw new Error(
      "Falta configurar SESSION_SECRET (o al menos APP_PASSWORD) en las variables de entorno."
    );
  }
  return secret;
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let str = "";
  for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return bytesToBase64Url(signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Crea un token de sesión firmado con expiración de 30 días. */
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const payload = String(expiresAt);
  const signature = await hmacSign(payload, getSecret());
  return `${payload}.${signature}`;
}

/** Verifica firma y expiración de un token de sesión. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;

  let expectedSignature: string;
  try {
    expectedSignature = await hmacSign(payload, getSecret());
  } catch {
    return false;
  }

  if (!timingSafeEqual(signature, expectedSignature)) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}
