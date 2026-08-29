import type { Metadata } from "next";
import { ProjectInventoryPage } from "@/features/projects";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Open-source components discovered in this project.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectInventoryPage projectId={id} />;
}
