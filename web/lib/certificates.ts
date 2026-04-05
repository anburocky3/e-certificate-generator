import fs from "node:fs/promises";
import path from "node:path";

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
  return resolveWebPath(process.env.CERTIFICATE_OUTPUT_DIR || "public/certificates");
}

function getManifestPath(): string {
  const configured = process.env.CERTIFICATE_INDEX_PATH || "public/certificates/index.json";
  return resolveWebPath(configured);
}

function getManifestPathCandidates(): string[] {
  const configured = process.env.CERTIFICATE_INDEX_PATH?.trim();
  const candidates = [
    getManifestPath(),
    resolveWebPath(configured || "public/certificates/index.json"),
    resolveWebPath("../output/index.json"),
  ];

  return [...new Set(candidates)];
}

function getOutputDirCandidates(): string[] {
  const configured = process.env.CERTIFICATE_OUTPUT_DIR?.trim();
  const candidates = [
    getOutputDir(),
    resolveWebPath(configured || "public/certificates"),
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

export async function loadCertificateIndex(): Promise<CertificateIndex> {
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

export async function readCertificateFile(fileName: string): Promise<Buffer> {
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

  throw new Error(`Certificate file is unavailable. ${errors.join(" | ")}`);
}
