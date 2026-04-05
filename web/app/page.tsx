import Link from "next/link";
import { redirect } from "next/navigation";

export default function HomePage() {

  redirect('/login')

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl sm:p-10">
      <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
        Two-module setup
      </span>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Generate certificates in Python and let users download them in Next.js.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            The Python CLI produces certificate images and a lookup manifest. The Next.js portal
            protects downloads with a shared secret PIN, then lets learners find their certificate
            with either a roll number or an email address.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
              href="/login"
            >
              Open PIN Login
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              href="/lookup"
            >
              Go to Download Portal
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
          <h2 className="text-lg font-semibold text-slate-900">What is included?</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <strong className="block text-slate-900">Python CLI</strong>
              <span className="text-sm text-slate-600">Excel to certificate image generation</span>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <strong className="block text-slate-900">Next.js App</strong>
              <span className="text-sm text-slate-600">PIN-gated lookup and download UI</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Add <code>roll_no</code> and <code>email</code> columns to your Excel file for the lookup
            portal to work end-to-end.
          </div>
        </aside>
      </div>
    </section>
  );
}

