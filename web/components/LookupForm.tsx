"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { lookupSchema, type LookupInput } from "@/lib/schemas";

type SearchResponseRecord = {
    certificateId: string;
    name: string;
    downloadUrl: string;
};

type SearchSuccessPayload = {
    record?: SearchResponseRecord;
};

type ErrorPayload = {
    message?: string;
};

export function LookupForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const [result, setResult] = useState<SearchResponseRecord | null>(null);

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<LookupInput>({
        resolver: zodResolver(lookupSchema),
        defaultValues: {
            rollNo: "",
            email: "",
        },
    });

    const onSubmit = handleSubmit(async (values) => {
        setServerError("");
        setResult(null);

        const response = await fetch("/api/certificates/search", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(values),
        });

        if (!response.ok) {
            const errorPayload: ErrorPayload = await response.json().catch(() => ({}));
            setServerError(errorPayload.message || "Could not find certificate.");
            return;
        }

        const successPayload: SearchSuccessPayload = await response.json().catch(() => ({}));
        if (!successPayload.record) {
            setServerError("Could not find certificate.");
            return;
        }

        setResult(successPayload.record);
    });

    async function logout() {
        await fetch("/api/auth/logout", {method: "POST"});
        router.push("/login");
        router.refresh();
    }

    return (
        <section
            className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white/85 p-8 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl">
            <div className={'flex items-center justify-between'}>
              <span
                  className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                Step 2
              </span>
                <button
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    type="button"
                    onClick={logout}
                >
                    Logout
                </button>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Find your certificate</h2>
            <p className="mt-2 text-slate-600">Enter your roll number or email address to access your certificate
                                               download link.</p>

            <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="rollNo">
                        Roll number
                    </label>
                    <input
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200"
                        id="rollNo"
                        type="text"
                        placeholder="E.g. 22CS104"
                        {...register("rollNo")}
                    />
                    {errors.rollNo ? <span className="text-sm text-rose-700">{errors.rollNo.message}</span> : null}
                </div>

                <div className={'flex items-center justify-center space-x-3 text-gray-500'}>
          <span className={''}>
            --------
          </span>
                    <span className={' text-center'}>OR</span>
                    <span>--------</span>
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="email">
                        Email address
                    </label>
                    <input
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200"
                        id="email"
                        type="email"
                        placeholder="you@awesome.com"
                        {...register("email")}
                    />
                    {errors.email ? <span className="text-sm text-rose-700">{errors.email.message}</span> : null}
                </div>

                {serverError ? (
                    <div
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{serverError}</div>
                ) : null}

                <button
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Searching..." : "Find certificate"}
                </button>
            </form>

            {result ? (
                <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                    <h3 className="mb-3 text-lg font-semibold text-emerald-800">Certificate found</h3>
                    <p className="mb-2 text-sm text-slate-700">
                        <strong>Name:</strong> {result.name}
                    </p>
                    <p className="mb-2 text-sm text-slate-700">
                        <strong>Certificate ID:</strong> {result.certificateId}
                    </p>
                    <p className="mb-4 text-sm text-slate-600">If the name does not match your details, contact the
                                                               event host.</p>
                    <a
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white! w-full transition hover:bg-emerald-500"
                        href={result.downloadUrl}
                    >
                        Download certificate
                    </a>
                </section>
            ) : null}


        </section>
    );
}

