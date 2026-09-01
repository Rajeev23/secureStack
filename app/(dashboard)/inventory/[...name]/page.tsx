import type { Metadata } from "next";
import { SessionComponentPage } from "@/features/inventory";
import { sessionInventoryNameFromSegments } from "@/features/scan-session";

export const metadata: Metadata = {
  title: "Component",
  description: "Current version, what changed, and findings for this package.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ name: string[] }>;
}) {
  const { name } = await params;
  return <SessionComponentPage name={sessionInventoryNameFromSegments(name)} />;
}
