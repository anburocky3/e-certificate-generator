"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RecordFilter = "all" | "downloaded" | "notDownloaded";

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

function StatusBadge({ status }: { status: DashboardRecord["status"] }) {
  if (status === "downloaded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            d="M7.75 13.25 4.5 10l1.05-1.05 2.2 2.2 6.7-6.7L15.5 5.5Z"
            fill="currentColor"
          />
        </svg>
        Downloaded
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
        Error
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      Pending
    </span>
  );
}

export function HostDownloadsPanel() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<RecordFilter>("all");

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

  const filteredRecords = useMemo(() => {
    if (filter === "downloaded") {
      return records.filter((record) => record.status === "downloaded");
    }

    if (filter === "notDownloaded") {
      return records.filter((record) => record.status !== "downloaded");
    }

    return records;
  }, [records, filter]);

  const notDownloadedCount = (overview?.pending || 0) + (overview?.error || 0);

  return (
    <section className="w-full rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-950/5 backdrop-blur-xl">
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

      {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between text-sm text-slate-700">
          <p className="font-medium">Overall completion</p>
          <p className="font-semibold text-slate-900">{completion}%</p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">Last refreshed: {formatDate(payload?.checkedAt)}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Downloaded</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{overview?.downloaded ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Not Downloaded</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{notDownloadedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Total Members</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{overview?.total ?? records.length}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            filter === "all"
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          All ({records.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("downloaded")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            filter === "downloaded"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Downloaded ({overview?.downloaded ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setFilter("notDownloaded")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            filter === "notDownloaded"
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Not Downloaded ({notDownloadedCount})
        </button>
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
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Roll no / Email</th>
              <th className="px-4 py-3">Certificate ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Downloaded at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRecords.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  {isLoading ? "Loading records..." : "No records found."}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => (
                <tr key={record.certificateId}>
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{record.name}</td>
                  <td className="px-4 py-3 text-slate-700">{record.rollNo || record.email || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{record.certificateId}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <StatusBadge status={record.status} />
                  </td>
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

