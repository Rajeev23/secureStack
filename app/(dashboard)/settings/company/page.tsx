import type { Metadata } from "next";
import { CompanySettingsPage } from "@/features/settings";

export const metadata: Metadata = {
  title: "Company settings",
  description: "View and update your company account.",
};

export default function Page() {
  return <CompanySettingsPage />;
}
