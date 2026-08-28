import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Patch and dependency update intelligence — current vs latest, what changed, and whether to update.",
};

export { DashboardPage as default } from "@/features/dashboard";
