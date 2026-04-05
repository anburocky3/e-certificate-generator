import crypto from "node:crypto";

export const AUTH_COOKIE_NAME = "certificate_portal_session";
export const HOST_AUTH_COOKIE_NAME = "certificate_host_session";
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

export function getConfiguredHostPin(): string {
  return String(process.env.CERT_HOST_PORTAL_PIN || process.env.CERT_PORTAL_PIN || "123456").trim();
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

function parseSessionToken(token: string | undefined): number | null {
  if (!token) {
    return null;
  }

  const [expiresAtText, signature] = token.split(".");
  if (!expiresAtText || !signature) {
    return null;
  }

  const expectedSignature = signPayload(expiresAtText);
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== receivedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return null;
  }

  const expiresAt = Number(expiresAtText);
  if (!Number.isFinite(expiresAt)) {
    return null;
  }

  return expiresAt;
}

export function verifySessionToken(token: string | undefined): boolean {
  const expiryDate = getSessionExpiryDate(token);
  if (!expiryDate) {
    return false;
  }

  const isExpired = Date.now() > expiryDate.getTime();
  return !isExpired;
}

export function isAuthenticatedToken(token: string | undefined): boolean {
  return verifySessionToken(token);
}

export function getSessionExpiryDate(token: string | undefined): Date | null {
  const expiresAt = parseSessionToken(token);
  if (!expiresAt) {
    return null;
  }

  return new Date(expiresAt * 1000);
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
