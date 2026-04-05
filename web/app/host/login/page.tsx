import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { HostPinLoginForm } from "@/components/HostPinLoginForm";
import { HOST_AUTH_COOKIE_NAME, isAuthenticatedToken } from "@/lib/auth";

export default async function HostLoginPage() {
  const token = (await cookies()).get(HOST_AUTH_COOKIE_NAME)?.value;
  if (isAuthenticatedToken(token)) {
    redirect("/host/status");
  }

  return <HostPinLoginForm />;
}

