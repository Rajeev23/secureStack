import type { Metadata } from "next";
import { ConnectProjectPage } from "@/features/projects";

export const metadata: Metadata = {
  title: "Connect GitHub",
  description: "Authorize GitHub and select one repository for this project.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConnectProjectPage projectId={id} />;
}
