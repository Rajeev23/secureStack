import type { Metadata } from "next";
import { UpdatesPage } from "@/features/updates";

export const metadata: Metadata = {
  title: "Updates",
  description: "New upstream versions with what changed and a recommended action.",
};

export default function Page() {
  return <UpdatesPage />;
}
