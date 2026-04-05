import crypto from "node:crypto";

export const AUTH_COOKIE_NAME = "certificate_portal_session";
export const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type AuthCookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
};

export function getConfiguredPin(): string {
  return String(process.env.CERT_PORTAL_PIN || "123456").trim();
}

export function getAuthSecret(): string {
  return String(process.env.CERT_PORTAL_AUTH_SECRET || "change-me-in-production");
}

function signPayload(payload: string): string {
  return crypto.createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

export function createSessionToken(maxAgeSeconds = DEFAULT_SESSION_MAX_AGE_SECONDS): string {
  const expiresAt = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload = String(expiresAt);
  return `${payload}.${signPayload(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const [expiresAtText, signature] = token.split(".");
  if (!expiresAtText || !signature) {
    return false;
  }

  const expectedSignature = signPayload(expiresAtText);
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  if (!crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return false;
  }

  const expiresAt = Number(expiresAtText);
  const isExpired = Math.floor(Date.now() / 1000) > expiresAt;
  if (!Number.isFinite(expiresAt) || isExpired) {
    return false;
  }

  return true;
}

export function isAuthenticatedToken(token: string | undefined): boolean {
  return verifySessionToken(token);
}

export function authCookieOptions(maxAgeSeconds = DEFAULT_SESSION_MAX_AGE_SECONDS): AuthCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
