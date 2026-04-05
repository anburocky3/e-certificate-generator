import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LookupForm } from "@/components/LookupForm";
import { AUTH_COOKIE_NAME, getSessionExpiryDate, isAuthenticatedToken } from "@/lib/auth";
import { getCertificateDownloadExpiryDate } from "@/lib/download-expiry";

export default async function LookupPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!isAuthenticatedToken(token)) {
    redirect("/login");
  }

  // const sessionExpiry = getSessionExpiryDate(token);
  // const sessionExpiryLabel = sessionExpiry
  //   ? new Intl.DateTimeFormat("en-IN", {
  //       dateStyle: "medium",
  //       timeStyle: "short",
  //     }).format(sessionExpiry)
  //   : null;

  const certificateExpiry = getCertificateDownloadExpiryDate();
  const certificateExpiryLabel = certificateExpiry
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(certificateExpiry)
    : null;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      {certificateExpiryLabel ? (
        <div className="rounded-3xl border border-rose-200 bg-linear-to-r from-rose-50 to-orange-50 px-6 py-5 shadow-lg shadow-rose-950/5">
          <span className="inline-flex rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
            Download expiry
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-rose-950">
            Certificate downloads close on {certificateExpiryLabel}
          </h2>
          <p className="mt-2 text-sm leading-6 text-rose-900/80">
            After this deadline, downloads are disabled by the host.
          </p>
        </div>
      ) : null}

      {/*{sessionExpiryLabel ? (*/}
      {/*  <div className="rounded-3xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 px-6 py-5 shadow-lg shadow-amber-950/5">*/}
      {/*    <span className="inline-flex rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">*/}
      {/*      Session expiry*/}
      {/*    </span>*/}
      {/*    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-amber-950">*/}
      {/*      Your PIN access expires on {sessionExpiryLabel}*/}
      {/*    </h2>*/}
      {/*    <p className="mt-2 text-sm leading-6 text-amber-900/80">*/}
      {/*      Download your certificate before this time. If the session expires, you can log in again with the same host PIN.*/}
      {/*    </p>*/}
      {/*  </div>*/}
      {/*) : null}*/}

      <LookupForm />
    </div>
  );
}

