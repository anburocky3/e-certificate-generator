"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HostStatusHeader() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/host-logout", { method: "POST" });
    router.push("/host/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-xl shadow-slate-950/5 backdrop-blur-xl">
      <div>
        <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
          Host dashboard
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Certificate system status</h1>
      </div>
      <button
        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        onClick={logout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </button>
    </header>
  );
}

