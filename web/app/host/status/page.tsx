import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { HostDownloadsPanel } from "@/components/HostDownloadsPanel";
import { HostStatusCard } from "@/components/HostStatusCard";
import { HostStatusHeader } from "@/components/HostStatusHeader";
import { HOST_AUTH_COOKIE_NAME, isAuthenticatedToken } from "@/lib/auth";

export default async function HostStatusPage() {
  const token = (await cookies()).get(HOST_AUTH_COOKIE_NAME)?.value;
  if (!isAuthenticatedToken(token)) {
    redirect("/host/login");
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <HostStatusHeader />
      <HostStatusCard />
      <HostDownloadsPanel />
    </div>
  );
}

