import type { CertificateIndex, CertificateRecord } from "@/lib/certificates";
import { Redis } from "@upstash/redis";

type DownloadEventStatus = "downloaded" | "failed";

type KvDownloadStats = {
  downloaded?: unknown;
  download_count?: unknown;
  downloaded_at?: unknown;
  failed_attempts?: unknown;
  last_failed_at?: unknown;
  last_failure_reason?: unknown;
};

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

function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedisClient(): Redis {
  return Redis.fromEnv();
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }

  return false;
}

function kvKeyForCertificate(certificateId: string): string {
  return `cert:downloads:${String(certificateId || "").trim().toLowerCase()}`;
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

function mergeKvStats(base: CertificateDownloadStatus, stats: KvDownloadStats | null): CertificateDownloadStatus {
  if (!stats) {
    return base;
  }

  const kvDownloadCount = toNonNegativeInteger(stats.download_count);
  const kvFailedAttempts = toNonNegativeInteger(stats.failed_attempts);
  const kvDownloadedAt = toIsoDate(stats.downloaded_at);
  const kvLastFailedAt = toIsoDate(stats.last_failed_at);
  const kvLastFailureReason = typeof stats.last_failure_reason === "string" ? stats.last_failure_reason : null;
  const kvDownloaded = toBoolean(stats.downloaded) || kvDownloadCount > 0;

  const merged: CertificateDownloadStatus = {
    ...base,
    downloadCount: Math.max(base.downloadCount, kvDownloadCount),
    failedAttempts: Math.max(base.failedAttempts, kvFailedAttempts),
    lastDownloadedAt: kvDownloadedAt || base.lastDownloadedAt,
    lastFailedAt: kvLastFailedAt || base.lastFailedAt,
    lastFailureReason: kvLastFailureReason || base.lastFailureReason,
  };

  if (kvDownloaded) {
    merged.status = "downloaded";
    merged.downloadCount = Math.max(1, merged.downloadCount);
  } else if (merged.failedAttempts > 0) {
    merged.status = "error";
  } else {
    merged.status = "pending";
  }

  return merged;
}

export async function recordDownloadEvent(input: {
  certificateId: string;
  status: DownloadEventStatus;
  reason?: string;
}): Promise<void> {
  if (!isRedisConfigured()) {
    return;
  }

  const redis = getRedisClient();

  const normalizedCertificateId = String(input.certificateId || "").trim().toLowerCase();
  if (!normalizedCertificateId) {
    return;
  }

  const key = kvKeyForCertificate(normalizedCertificateId);
  const now = new Date().toISOString();

  if (input.status === "downloaded") {
    await redis.hset(key, {
      downloaded: 1,
      downloaded_at: now,
    });
    await redis.hincrby(key, "download_count", 1);
    return;
  }

  await redis.hset(key, {
    last_failed_at: now,
    last_failure_reason: String(input.reason || "Download failed.").slice(0, 300),
  });
  await redis.hincrby(key, "failed_attempts", 1);
}

export async function buildDownloadStatuses(index: CertificateIndex): Promise<CertificateDownloadStatus[]> {
  const baseStatuses = index.records.map((record) => normalizeRecord(record));
  if (!isRedisConfigured()) {
    return baseStatuses;
  }

  const redis = getRedisClient();

  return Promise.all(
    baseStatuses.map(async (status) => {
      const key = kvKeyForCertificate(status.certificateId);
      const stats = (await redis.hgetall(key)) as KvDownloadStats | null;
      return mergeKvStats(status, stats);
    }),
  );
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

