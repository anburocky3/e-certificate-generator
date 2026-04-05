import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HOST_AUTH_COOKIE_NAME, isAuthenticatedToken } from "@/lib/auth";
import { loadCertificateIndex, type CertificateRecord } from "@/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DashboardRecord = {
  certificateId: string;
  name: string;
  rollNo?: string | null;
  email?: string | null;
  status: "downloaded" | "pending" | "error";
  downloadCount: number;
  lastDownloadedAt: string | null;
  failedAttempts: number;
  lastFailureReason: string | null;
};

function toNonNegativeInteger(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 0;
  }

  const normalized = Math.floor(num);
  return normalized > 0 ? normalized : 0;
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function toDashboardRecord(record: CertificateRecord): DashboardRecord {
  const downloadCount = toNonNegativeInteger(record.download_count);
  const failedAttempts = toNonNegativeInteger(record.failed_attempts);
  const downloaded = record.downloaded === true || downloadCount > 0;

  return {
    certificateId: record.certificate_id,
    name: record.name,
    rollNo: record.roll_no,
    email: record.email,
    status: downloaded ? "downloaded" : failedAttempts > 0 ? "error" : "pending",
    downloadCount: downloaded ? Math.max(downloadCount, 1) : 0,
    lastDownloadedAt: toIsoDate(record.downloaded_at),
    failedAttempts,
    lastFailureReason: typeof record.last_failure_reason === "string" ? record.last_failure_reason : null,
  };
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(HOST_AUTH_COOKIE_NAME)?.value;
  if (!isAuthenticatedToken(token)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const index = await loadCertificateIndex({ origin: request.nextUrl.origin });
    const records = index.records.map(toDashboardRecord);

    const overview = records.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === "downloaded") {
          acc.downloaded += 1;
        } else if (item.status === "error") {
          acc.error += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { total: 0, downloaded: 0, pending: 0, error: 0, allDownloaded: false },
    );

    overview.allDownloaded = overview.total > 0 && overview.pending === 0 && overview.error === 0;

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

