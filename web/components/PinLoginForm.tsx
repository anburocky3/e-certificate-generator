"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { pinSchema, type PinInput } from "@/lib/schemas";

type ErrorPayload = { message?: string };

export function PinLoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PinInput>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError("");

    const response = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload: ErrorPayload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setServerError(payload.message || "Wrong PIN. Please try again.");
      return;
    }

    router.push("/lookup");
    router.refresh();
  });

  return (
    <section className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white/85 p-8 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl">
      <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
        Step 1
      </span>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Enter the shared PIN</h2>
      <p className="mt-2 text-slate-600">Use the secret PIN shared by the host to unlock certificate search.</p>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-800" htmlFor="pin">
            Secret PIN
          </label>
          <input
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200"
            id="pin"
            type="password"
            placeholder="Enter the shared PIN"
            {...register("pin")}
          />
          {errors.pin ? <span className="text-sm text-rose-700">{errors.pin.message}</span> : null}
        </div>

        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{serverError}</div>
        ) : null}

        <button
          className="inline-flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Verifying..." : "Unlock certificate portal"}
        </button>
      </form>
    </section>
  );
}

