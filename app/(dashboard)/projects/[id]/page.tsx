import type { Metadata } from "next";
import { ProjectDetailPage } from "@/features/projects";

export const metadata: Metadata = {
  title: "Project",
  description: "Project overview, repository, and scan status.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailPage projectId={id} />;
}
