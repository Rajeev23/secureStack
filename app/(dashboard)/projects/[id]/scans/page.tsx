import type { Metadata } from "next";
import { ProjectScansPage } from "@/features/projects";

export const metadata: Metadata = {
  title: "Scans",
  description: "Scan history and what changed since the previous run.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectScansPage projectId={id} />;
}
