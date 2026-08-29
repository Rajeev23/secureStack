import type { Metadata } from "next";
import { ProjectOverviewPage } from "@/features/projects";

export const metadata: Metadata = {
  title: "Overview",
  description: "Repository connection, files to monitor, and scan status.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectOverviewPage projectId={id} />;
}
