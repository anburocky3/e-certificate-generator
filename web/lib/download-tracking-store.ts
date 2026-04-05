import type { CertificateIndex, CertificateRecord } from "@/lib/certificates";

type DownloadEventStatus = "downloaded" | "failed";

export type CertificateDownloadStatus = {
  certificateId: string;
  name: string;
  rollNo?: string | null;
  email?: string | null;
  fileName: string;
  status: "downloaded" | "pending" | "error";
  downloadCount: number;
  lastDownloadedAt: string | null;
  failedAttempts: number;
  lastFailedAt: string | null;
  lastFailureReason: string | null;
};

export type CertificateDownloadOverview = {
  total: number;
  downloaded: number;
  pending: number;
  error: number;
  allDownloaded: boolean;
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

function normalizeRecord(record: CertificateRecord): CertificateDownloadStatus {
  const downloadCount = toNonNegativeInteger(record.download_count);
  const failedAttempts = toNonNegativeInteger(record.failed_attempts);
  const lastDownloadedAt = toIsoDate(record.downloaded_at);
  const hasDownloaded = record.downloaded === true || downloadCount > 0;
  const lastFailureReason = typeof record.last_failure_reason === "string" ? record.last_failure_reason : null;

  return {
    certificateId: String(record.certificate_id || "").trim().toLowerCase(),
    name: record.name,
    rollNo: record.roll_no,
    email: record.email,
    fileName: record.file_name,
    status: hasDownloaded ? "downloaded" : failedAttempts > 0 ? "error" : "pending",
    downloadCount: hasDownloaded ? Math.max(1, downloadCount) : 0,
    lastDownloadedAt,
    failedAttempts,
    lastFailedAt: null,
    lastFailureReason,
  };
}

export async function recordDownloadEvent(input: {
  certificateId: string;
  status: DownloadEventStatus;
  reason?: string;
}): Promise<void> {
  void input;
  // No-op by design: manifest fields are the source of truth in this deployment mode.
}

export async function buildDownloadStatuses(index: CertificateIndex): Promise<CertificateDownloadStatus[]> {
  return index.records.map((record) => normalizeRecord(record));
}

export function summarizeDownloadStatuses(records: CertificateDownloadStatus[]): CertificateDownloadOverview {
  const overview: CertificateDownloadOverview = {
    total: records.length,
    downloaded: 0,
    pending: 0,
    error: 0,
    allDownloaded: records.length > 0,
  };

  for (const record of records) {
    if (record.status === "downloaded") {
      overview.downloaded += 1;
      continue;
    }

    if (record.status === "error") {
      overview.error += 1;
      continue;
    }

    overview.pending += 1;
  }

  overview.allDownloaded = overview.total > 0 && overview.pending === 0 && overview.error === 0;
  return overview;
}

