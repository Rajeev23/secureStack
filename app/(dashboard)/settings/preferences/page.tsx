import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Layout and color mode for this device.",
};

export { PreferencesSettingsPage as default } from "@/features/settings";
