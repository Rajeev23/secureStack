import type { Metadata } from "next";
import { ScansPage } from "@/features/scans";

export const metadata: Metadata = {
  title: "Scans",
  description: "The scan held in this browser tab.",
};

export default function Page() {
  return <ScansPage />;
}
