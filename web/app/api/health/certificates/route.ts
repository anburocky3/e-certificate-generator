import { NextResponse } from "next/server";

import { loadCertificateIndex, readCertificateFile } from "@/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FileCheck = {
  checked: number;
  passed: number;
  failed: number;
  sampledIds: string[];
};

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    const index = await loadCertificateIndex();
    const sampleRecords = index.records.slice(0, 3);

    const fileCheck: FileCheck = {
      checked: sampleRecords.length,
      passed: 0,
      failed: 0,
      sampledIds: sampleRecords.map((record) => record.certificate_id),
    };

    const fileErrors: string[] = [];
    for (const record of sampleRecords) {
      try {
        await readCertificateFile(record.file_name);
        fileCheck.passed += 1;
      } catch (error) {
        fileCheck.failed += 1;
        const reason = error instanceof Error ? error.message : String(error);
        fileErrors.push(`${record.file_name}: ${reason}`);
      }
    }

    const ok = fileCheck.failed === 0;
    const status = ok ? 200 : 503;

    return NextResponse.json(
      {
        ok,
        status: ok ? "healthy" : "degraded",
        checkedAt,
        manifest: {
          generatedAt: index.generatedAt,
          certificateCount: index.certificateCount,
          recordsLoaded: index.records.length,
        },
        files: fileCheck,
        errors: fileErrors,
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        ok: false,
        status: "unhealthy",
        checkedAt,
        manifest: null,
        files: {
          checked: 0,
          passed: 0,
          failed: 0,
          sampledIds: [],
        },
        errors: [reason],
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

