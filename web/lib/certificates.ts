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

export function getOutputDir(): string {
  return resolveWebPath(process.env.CERTIFICATE_OUTPUT_DIR || "../output");
}

export function getManifestPath(): string {
  const configured = process.env.CERTIFICATE_INDEX_PATH || "../output/index.json";
  return resolveWebPath(configured);
}

export function normalizeLookup(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export function normalizeCertificateId(value: unknown): string {
  return normalizeLookup(value);
}

export async function loadCertificateIndex(): Promise<CertificateIndex> {
  const manifestPath = getManifestPath();
  const raw = await fs.readFile(manifestPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.records)) {
    throw new Error("Certificate index file is invalid.");
  }

  return parsed as CertificateIndex;
}

export function findCertificateRecord(
  records: CertificateRecord[],
  { rollNo, email }: { rollNo?: string; email?: string },
): CertificateRecord | undefined {
  const normalizedRollNo = normalizeLookup(rollNo);
  const normalizedEmail = normalizeLookup(email);

  return records.find((record) => {
    const recordRollNo = normalizeLookup(record.roll_no);
    const recordEmail = normalizeLookup(record.email);

    if (normalizedEmail && normalizedRollNo) {
      return recordEmail === normalizedEmail && recordRollNo === normalizedRollNo;
    }

    if (normalizedEmail && recordEmail === normalizedEmail) {
      return true;
    }

    return Boolean(normalizedRollNo && recordRollNo === normalizedRollNo);
  });
}

export function findCertificateById(
  records: CertificateRecord[],
  certificateId: string,
): CertificateRecord | undefined {
  const normalizedInput = normalizeCertificateId(certificateId);
  return records.find((record) => normalizeCertificateId(record.certificate_id) === normalizedInput);
}

export async function readCertificateFile(fileName: string): Promise<Buffer> {
  const outputDir = getOutputDir();
  const resolvedFilePath = path.resolve(outputDir, fileName);
  const relativePath = path.relative(path.resolve(outputDir), resolvedFilePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid certificate path.");
  }

  return fs.readFile(resolvedFilePath);
}
