import { NextResponse } from "next/server";

import { HOST_AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(HOST_AUTH_COOKIE_NAME, "", {
	...authCookieOptions(),
	maxAge: 0,
  });

  return response;
}

