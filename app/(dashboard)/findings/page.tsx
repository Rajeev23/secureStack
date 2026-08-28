import type { Metadata } from "next";
import { FindingsPage } from "@/features/findings";

export const metadata: Metadata = {
  title: "Findings",
  description: "Security, update, and EOL findings from the latest repository scans.",
};

export default function Page() {
  return <FindingsPage />;
}
