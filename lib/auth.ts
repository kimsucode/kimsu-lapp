import { createHmac, timingSafeEqual } from "crypto";

import { env } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "admin_session";

function signAdminSession(): string {
  return createHmac("sha256", env.adminSessionSecret)
    .update(`admin:${env.adminPassword}`)
    .digest("hex");
}

export function verifyPassword(candidate: string): boolean {
  const expected = Buffer.from(env.adminPassword);
  const input = Buffer.from(candidate);

  if (expected.length !== input.length) {
    return false;
  }

  return timingSafeEqual(expected, input);
}

export function buildAdminSessionValue(): string {
  return signAdminSession();
}

export function isValidAdminSession(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const expected = Buffer.from(signAdminSession());
  const provided = Buffer.from(value);

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(expected, provided);
}
