import { getAuthEnv } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "admin_session";

const te = new TextEncoder();

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string) {
  if (!hex || hex.length % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function hmacSha256Hex(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    te.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, te.encode(message));
  return toHex(sig);
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function buildPayload() {
  return String(Date.now());
}

export async function signAdminSession() {
  const { ADMIN_SESSION_SECRET } = getAuthEnv();
  const payload = buildPayload();
  const sig = await hmacSha256Hex(payload, ADMIN_SESSION_SECRET);
  return `${payload}.${sig}`;
}

export async function isValidAdminSession(session?: string | null) {
  if (!session) return false;
  const [payload, sig] = session.split(".");
  if (!payload || !sig) return false;

  const { ADMIN_SESSION_SECRET } = getAuthEnv();
  const expected = await hmacSha256Hex(payload, ADMIN_SESSION_SECRET);

  const a = fromHex(sig);
  const b = fromHex(expected);
  return timingSafeEqualBytes(a, b);
}
