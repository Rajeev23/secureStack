import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout";
import { isAuthDevBypassEnabled } from "@/lib/auth/proxy-access";
import { getSessionUserId } from "@/lib/auth/session";
import { resolvePostAuthRedirect } from "@/services/api/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const userId = await getSessionUserId();

  if (!userId) {
    if (isAuthDevBypassEnabled()) {
      return <AppShell>{children}</AppShell>;
    }
    redirect("/login");
  }

  const destination = await resolvePostAuthRedirect(userId);
  if (destination === "/onboarding") {
    redirect("/onboarding");
  }

  return <AppShell>{children}</AppShell>;
}
