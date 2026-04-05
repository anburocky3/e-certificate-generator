import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, isAuthenticatedToken } from "@/lib/auth";
import {
  findCertificateById,
  loadCertificateIndex,
  readCertificateFile,
} from "@/lib/certificates";

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

  try {
    const index = await loadCertificateIndex();
    const record = findCertificateById(index.records, certificateId);

    if (!record) {
      return NextResponse.json({ message: "Certificate not found." }, { status: 404 });
    }

    const imageBuffer = await readCertificateFile(record.file_name);
    const bytes = Uint8Array.from(imageBuffer);
    const responseBody = new Blob([bytes], { type: "image/png" });

    return new NextResponse(responseBody, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${record.file_name}"`,
      },
    });
  } catch {
    return NextResponse.json({ message: "Certificate file is unavailable." }, { status: 500 });
  }
}
