import type { Metadata } from "next";
import { ScanPage } from "@/features/scan-session";

export const metadata: Metadata = {
  title: "Scan",
  description: "Connect GitHub or upload a file. See what to update. Nothing is stored.",
};

export default function Page() {
  return <ScanPage />;
}
