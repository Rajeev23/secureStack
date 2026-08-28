import type { Metadata } from "next";
import { AccountSettingsPage } from "@/features/settings";

export const metadata: Metadata = {
  title: "Account",
  description: "Update your name and password.",
};

export default function Page() {
  return <AccountSettingsPage />;
}
