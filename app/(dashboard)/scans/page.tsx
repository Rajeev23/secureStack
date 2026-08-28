import type { Metadata } from "next";
import { ScansPage } from "@/features/scans";

export const metadata: Metadata = {
  title: "Scans",
  description: "Manual and scheduled repository scans for this company.",
};

export default function Page() {
  return <ScansPage />;
}
