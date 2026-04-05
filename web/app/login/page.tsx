import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PinLoginForm } from "@/components/PinLoginForm";
import { AUTH_COOKIE_NAME, isAuthenticatedToken } from "@/lib/auth";

export default async function LoginPage() {
    const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
    if (isAuthenticatedToken(token)) {
        redirect("/lookup");
    }

    return <PinLoginForm />;
}

