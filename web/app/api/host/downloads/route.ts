import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HOST_AUTH_COOKIE_NAME, isAuthenticatedToken } from "@/lib/auth";
import { loadCertificateIndex } from "@/lib/certificates";
import { buildDownloadStatuses, summarizeDownloadStatuses } from "@/lib/download-tracking-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(HOST_AUTH_COOKIE_NAME)?.value;
  if (!isAuthenticatedToken(token)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const index = await loadCertificateIndex({ origin: request.nextUrl.origin });
    const records = await buildDownloadStatuses(index);
    const overview = summarizeDownloadStatuses(records);

    return NextResponse.json(
      {
        checkedAt: new Date().toISOString(),
        overview,
        records,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load dashboard data.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

