import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, isAuthenticatedToken } from "@/lib/auth";
import { findCertificateRecord, loadCertificateIndex } from "@/lib/certificates";
import { getCertificateDownloadExpiryDate, isCertificateDownloadExpired } from "@/lib/download-expiry";
import { lookupSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!isAuthenticatedToken(token)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = lookupSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message || "Invalid lookup request." },
      { status: 422 },
    );
  }

  if (isCertificateDownloadExpired()) {
    const expiryDate = getCertificateDownloadExpiryDate();
    return NextResponse.json(
      {
        message: "Certificate downloads have expired.",
        expiredAt: expiryDate?.toISOString() || null,
      },
      { status: 410 },
    );
  }

  try {
    const index = await loadCertificateIndex({ origin: request.nextUrl.origin });
    const record = findCertificateRecord(index.records, parsed.data);

    if (!record) {
      return NextResponse.json({ message: "No certificate found for those details." }, { status: 404 });
    }

    return NextResponse.json({
      record: {
        certificateId: record.certificate_id,
        name: record.name,
        downloadUrl: `/api/certificates/download/${encodeURIComponent(record.certificate_id)}`,
      },
    });
  } catch (error) {
    console.error("Certificate search failed:", error);
    return NextResponse.json(
      { message: "Certificate index is unavailable. Ask the host to regenerate certificates." },
      { status: 500 },
    );
  }
}

