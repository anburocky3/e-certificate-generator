"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

type DashboardPayload = {
  checkedAt?: string;
  overview?: {
    total: number;
    downloaded: number;
    pending: number;
    error: number;
    allDownloaded: boolean;
  };
  records?: DashboardRecord[];
  message?: string;
};

function formatDate(value: string | null | undefined): string {
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

export function HostDownloadsCard() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/host/downloads", { cache: "no-store" });
      const body: DashboardPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPayload(null);
        setError(body.message || "Could not load download status.");
        return;
      }

      setPayload(body);
    } catch {
      setPayload(null);
      setError("Could not reach host download API.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const records = payload?.records || [];
  const overview = payload?.overview;

  const completion = useMemo(() => {
    if (!overview || overview.total <= 0) {
      return 0;
    }

    return Math.round((overview.downloaded / overview.total) * 100);
  }, [overview]);

  return (
    <section className="w-full rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-xl shadow-slate-950/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Member downloads</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Who downloaded certificates</h3>
        </div>
        <button
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={loadData}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        <p>
          <strong>Checked at:</strong> {formatDate(payload?.checkedAt)}
        </p>
        <p>
          <strong>Completion:</strong> {completion}%
        </p>
        <p>
          <strong>Downloaded:</strong> {overview?.downloaded ?? 0}
        </p>
        <p>
          <strong>Pending:</strong> {overview?.pending ?? 0}
        </p>
      </div>

      {overview?.allDownloaded ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          All members have downloaded. You can safely remove expired certificates.
        </p>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Roll no / Email</th>
              <th className="px-4 py-3">Certificate ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Downloaded at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {records.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  {isLoading ? "Loading records..." : "No records found."}
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.certificateId}>
                  <td className="px-4 py-3 font-medium text-slate-900">{record.name}</td>
                  <td className="px-4 py-3 text-slate-700">{record.rollNo || record.email || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{record.certificateId}</td>
                  <td className="px-4 py-3 text-slate-700">{record.status}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(record.lastDownloadedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

