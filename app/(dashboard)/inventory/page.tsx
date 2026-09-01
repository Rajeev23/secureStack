import type { Metadata } from "next";
import { InventoryPage } from "@/features/inventory";

export const metadata: Metadata = {
  title: "Report",
  description: "Open-source components currently in use. Click a row for what changed and the recommendation.",
};

export default function Page() {
  return <InventoryPage />;
}
