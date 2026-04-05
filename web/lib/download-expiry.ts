export function getCertificateDownloadExpiryDate(): Date | null {
  const raw = String(process.env.CERT_DOWNLOAD_EXPIRES_AT || "").trim();
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function isCertificateDownloadExpired(now = new Date()): boolean {
  const expiryDate = getCertificateDownloadExpiryDate();
  if (!expiryDate) {
    return false;
  }

  return now.getTime() > expiryDate.getTime();
}

