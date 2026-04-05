import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, isAuthenticatedToken } from "@/lib/auth";
import {
  findCertificateById,
  loadCertificateIndex,
  markCertificateDownloadedInManifest,
  readCertificateFile,
} from "@/lib/certificates";
import { recordDownloadEvent } from "@/lib/download-tracking-store";
import { getCertificateDownloadExpiryDate, isCertificateDownloadExpired } from "@/lib/download-expiry";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ certificateId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!isAuthenticatedToken(token)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const routeParams = await context.params;
  const certificateId = decodeURIComponent(String(routeParams?.certificateId || "")).trim();
  if (!certificateId) {
    return NextResponse.json({ message: "Invalid certificate id." }, { status: 422 });
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
    const record = findCertificateById(index.records, certificateId);

    if (!record) {
      return NextResponse.json({ message: "Certificate not found." }, { status: 404 });
    }

    const imageBuffer = await readCertificateFile(record.file_name, { origin: request.nextUrl.origin });
    await recordDownloadEvent({
      certificateId: record.certificate_id,
      status: "downloaded",
    }).catch(() => {
      // Ignore KV failures so certificate delivery remains available.
    });
    await markCertificateDownloadedInManifest(record.certificate_id).catch(() => {
      // Ignore manifest update failures (read-only FS on serverless).
    });

    const bytes = Uint8Array.from(imageBuffer);
    const responseBody = new Blob([bytes], { type: "image/png" });

    return new NextResponse(responseBody, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${record.file_name}"`,
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await recordDownloadEvent({
      certificateId,
      status: "failed",
      reason,
    }).catch(() => {
      // Ignore KV failures so original API error is preserved.
    });

    console.error("Certificate download failed:", error);
    return NextResponse.json({ message: "Certificate file is unavailable." }, { status: 500 });
  }
}
