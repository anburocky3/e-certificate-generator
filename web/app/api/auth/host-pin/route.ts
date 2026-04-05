import crypto from "node:crypto";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  HOST_AUTH_COOKIE_NAME,
  authCookieOptions,
  createSessionToken,
  getConfiguredHostPin,
} from "@/lib/auth";
import { pinSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = pinSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message || "Invalid PIN payload." },
      { status: 422 },
    );
  }

  const expected = Buffer.from(getConfiguredHostPin());
  const actual = Buffer.from(parsed.data.pin.trim());
  const isValidPin = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

  if (!isValidPin) {
    return NextResponse.json({ message: "The provided host PIN is incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(HOST_AUTH_COOKIE_NAME, createSessionToken(), authCookieOptions());
  return response;
}

