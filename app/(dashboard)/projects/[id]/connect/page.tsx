import type { Metadata } from "next";
import { ConnectProjectPage } from "@/features/projects";

export const metadata: Metadata = {
  title: "Connect GitHub",
  description: "Authorize GitHub, select a repository, then choose a full-repo scan or specific files to monitor.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConnectProjectPage projectId={id} />;
}
