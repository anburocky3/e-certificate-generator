import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_OUTPUT_DIR = "certificates";
const DEFAULT_MANIFEST_PATH = "certificates/index.json";

type CertificateReadOptions = {
  origin?: string;
};

export type CertificateRecord = {
  certificate_id: string;
  name: string;
  row: number;
  file_name: string;
  roll_no?: string | null;
  email?: string | null;
};

export type CertificateIndex = {
  generatedAt: string;
  certificateCount: number;
  records: CertificateRecord[];
};

export function resolveWebPath(value: string): string {
  return path.isAbsolute(value)
    ? value
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), value);
}

function getOutputDir(): string {
  return resolveWebPath(process.env.CERTIFICATE_OUTPUT_DIR || DEFAULT_OUTPUT_DIR);
}

function getManifestPath(): string {
  const configured = process.env.CERTIFICATE_INDEX_PATH || DEFAULT_MANIFEST_PATH;
  return resolveWebPath(configured);
}

function toFilesystemCandidates(rawPath: string): string[] {
  if (path.isAbsolute(rawPath)) {
    return [rawPath];
  }

  const normalized = rawPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized) {
    return [];
  }

  const candidates = [normalized];
  if (normalized.startsWith("public/")) {
    candidates.push(normalized.slice("public/".length));
  } else {
    candidates.push(`public/${normalized}`);
  }

  return [...new Set(candidates)];
}

function normalizePublicAssetPath(rawPath: string, fallback: string): string {
  const normalized = (rawPath || fallback).replace(/\\/g, "/").replace(/^\/+/, "");
  const withoutPublic = normalized.startsWith("public/") ? normalized.slice("public/".length) : normalized;
  return withoutPublic || fallback;
}

function getPublicManifestPath(): string {
  return normalizePublicAssetPath(process.env.CERTIFICATE_INDEX_PATH || DEFAULT_MANIFEST_PATH, DEFAULT_MANIFEST_PATH);
}

function getPublicOutputDirPath(): string {
  return normalizePublicAssetPath(process.env.CERTIFICATE_OUTPUT_DIR || DEFAULT_OUTPUT_DIR, DEFAULT_OUTPUT_DIR);
}

function buildPublicAssetUrl(origin: string, assetPath: string): string {
  const cleanedPath = assetPath.replace(/^\/+/, "");
  return new URL(`/${cleanedPath}`, origin).toString();
}

function getManifestPathCandidates(): string[] {
  const configured = process.env.CERTIFICATE_INDEX_PATH?.trim() || DEFAULT_MANIFEST_PATH;
  const candidates = [
    ...toFilesystemCandidates(configured).map((candidate) => resolveWebPath(candidate)),
    getManifestPath(),
    resolveWebPath("../output/index.json"),
  ];

  return [...new Set(candidates)];
}

function getOutputDirCandidates(): string[] {
  const configured = process.env.CERTIFICATE_OUTPUT_DIR?.trim() || DEFAULT_OUTPUT_DIR;
  const candidates = [
    ...toFilesystemCandidates(configured).map((candidate) => resolveWebPath(candidate)),
    getOutputDir(),
    resolveWebPath("../output"),
  ];

  return [...new Set(candidates)];
}

export function normalizeLookup(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export function normalizeCertificateId(value: unknown): string {
  return normalizeLookup(value);
}

export async function loadCertificateIndex(options?: CertificateReadOptions): Promise<CertificateIndex> {
  const attemptedPaths: string[] = [];
  const failureMessages: string[] = [];

  for (const manifestPath of getManifestPathCandidates()) {
    attemptedPaths.push(manifestPath);

    try {
      const raw = await fs.readFile(manifestPath, "utf8");
      const parsed = JSON.parse(raw);

      if (!parsed || !Array.isArray(parsed.records)) {
        failureMessages.push(`${manifestPath}: invalid records array`);
        continue;
      }

      return parsed as CertificateIndex;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      failureMessages.push(`${manifestPath}: ${detail}`);
    }
  }

  if (options?.origin) {
    const manifestUrl = buildPublicAssetUrl(options.origin, getPublicManifestPath());
    attemptedPaths.push(manifestUrl);

    try {
      const response = await fetch(manifestUrl, { cache: "no-store" });
      if (!response.ok) {
        failureMessages.push(`${manifestUrl}: HTTP ${response.status}`);
      } else {
        const parsed = (await response.json()) as unknown;
        if (!parsed || !Array.isArray((parsed as { records?: unknown }).records)) {
          failureMessages.push(`${manifestUrl}: invalid records array`);
        } else {
          return parsed as CertificateIndex;
        }
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      failureMessages.push(`${manifestUrl}: ${detail}`);
    }
  }

  throw new Error(
    `Certificate index file is unavailable. Attempted: ${attemptedPaths.join(" | ")}. Details: ${failureMessages.join(" | ")}`,
  );
}

export function findCertificateRecord(
  records: CertificateRecord[],
  { rollNo, email }: { rollNo?: string; email?: string },
): CertificateRecord | undefined {
  const normalizedRollNo = normalizeLookup(rollNo);
  const normalizedEmail = normalizeLookup(email);

  if (normalizedRollNo) {
    return records.find((record) => normalizeLookup(record.roll_no) === normalizedRollNo);
  }

  if (normalizedEmail) {
    return records.find((record) => normalizeLookup(record.email) === normalizedEmail);
  }

  return undefined;
}

export function findCertificateById(
  records: CertificateRecord[],
  certificateId: string,
): CertificateRecord | undefined {
  const normalizedInput = normalizeCertificateId(certificateId);
  return records.find((record) => normalizeCertificateId(record.certificate_id) === normalizedInput);
}

export async function readCertificateFile(fileName: string, options?: CertificateReadOptions): Promise<Buffer> {
  const errors: string[] = [];

  for (const outputDir of getOutputDirCandidates()) {
    const resolvedFilePath = path.resolve(outputDir, fileName);
    const relativePath = path.relative(path.resolve(outputDir), resolvedFilePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw new Error("Invalid certificate path.");
    }

    try {
      return await fs.readFile(resolvedFilePath);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      errors.push(`${resolvedFilePath}: ${detail}`);
    }
  }

  if (options?.origin) {
    const publicDir = getPublicOutputDirPath();
    const encodedFileName = fileName.split("/").map((segment) => encodeURIComponent(segment)).join("/");
    const fileUrl = buildPublicAssetUrl(options.origin, `${publicDir}/${encodedFileName}`);

    try {
      const response = await fetch(fileUrl, { cache: "no-store" });
      if (!response.ok) {
        errors.push(`${fileUrl}: HTTP ${response.status}`);
      } else {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      errors.push(`${fileUrl}: ${detail}`);
    }
  }

  throw new Error(`Certificate file is unavailable. ${errors.join(" | ")}`);
}
