import type { Metadata } from "next";
import { ProjectInventoryItemPage } from "@/features/projects";
import { inventoryNameFromSegments } from "@/features/projects/model";

export const metadata: Metadata = {
  title: "Component",
  description: "Current version, what changed, and findings for this package.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; name: string[] }>;
}) {
  const { id, name } = await params;
  return <ProjectInventoryItemPage projectId={id} name={inventoryNameFromSegments(name)} />;
}
