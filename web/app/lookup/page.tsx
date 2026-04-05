import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LookupForm } from "@/components/LookupForm";
import { AUTH_COOKIE_NAME, isAuthenticatedToken } from "@/lib/auth";

export default async function LookupPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!isAuthenticatedToken(token)) {
    redirect("/login");
  }

  return <LookupForm />;
}

