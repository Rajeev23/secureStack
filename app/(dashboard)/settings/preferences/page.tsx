import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preferences",
  description: "Layout, color mode, and notification preferences.",
};

export { PreferencesSettingsPage as default } from "@/features/settings";
