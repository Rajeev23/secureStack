import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Project",
  description: "Project overview, repository, and scan status.",
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ connect?: string }>;
}) {
  const { id } = await params;
  const { connect } = await searchParams;
  const suffix = connect === "skip" ? "?connect=skip" : "";
  redirect(`/projects/${id}/overview${suffix}`);
}
