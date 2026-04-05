"use client";

import { useCallback, useEffect, useState } from "react";

type HealthManifest = {
  generatedAt?: string;
  certificateCount?: number;
  recordsLoaded?: number;
};

type HealthFiles = {
  checked?: number;
  passed?: number;
  failed?: number;
};

type HealthPayload = {
  ok?: boolean;
  status?: string;
  message?: string;
  checkedAt?: string;
  errors?: string[];
  manifest?: HealthManifest | null;
  files?: HealthFiles;
};

function formatDateTime(value: string | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function HostStatusCard() {
  const [payload, setPayload] = useState<HealthPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState("");

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setRequestError("");

    try {
      const response = await fetch("/api/health/certificates", {
        method: "GET",
        cache: "no-store",
      });

      const body: HealthPayload = await response.json().catch(() => ({}));
      setPayload(body);

      if (!response.ok && !body?.errors?.length) {
        setRequestError(body?.message || "Health endpoint returned an unexpected error.");
      }
    } catch {
      setPayload(null);
      setRequestError("Could not reach health endpoint.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const isHealthy = payload?.ok === true;
  const statusText = isLoading ? "Checking" : isHealthy ? "Healthy" : "Needs attention";
  const cardClass = isLoading
    ? "border-slate-200 bg-white/85"
    : isHealthy
      ? "border-emerald-200 bg-emerald-50/80"
      : "border-rose-200 bg-rose-50/80";

  const firstError = requestError || payload?.errors?.[0] || "";

  return (
    <section className={`w-full rounded-3xl border p-6 shadow-xl shadow-slate-950/5 ${cardClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Host status</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Certificate service: {statusText}</h3>
        </div>
        <button
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={loadStatus}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-700">
        <p>
          <strong>Checked at:</strong> {formatDateTime(payload?.checkedAt)}
        </p>
        <p>
          <strong>Total certificates:</strong> {payload?.manifest?.certificateCount ?? "-"}
        </p>
        <p>
          <strong>Sample files passed:</strong> {payload?.files?.passed ?? 0}/{payload?.files?.checked ?? 0}
        </p>
      </div>

      {firstError ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-100/80 px-3 py-2 text-sm text-rose-800">{firstError}</p>
      ) : null}
    </section>
  );
}

