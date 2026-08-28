import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingPage } from "@/features/onboarding";
import { isAuthDevBypassEnabled } from "@/lib/auth/proxy-access";
import { getSessionUserId } from "@/lib/auth/session";
import { resolvePostAuthRedirect } from "@/services/api/auth";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Name your company to finish SecureStack setup.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getSessionUserId();

  if (!userId) {
    if (isAuthDevBypassEnabled()) {
      return <OnboardingPage />;
    }
    redirect("/login?redirect=/onboarding");
  }

  const destination = await resolvePostAuthRedirect(userId);
  if (destination === "/dashboard") {
    redirect("/dashboard");
  }

  return <OnboardingPage />;
}
