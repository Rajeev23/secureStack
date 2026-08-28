import type { Metadata } from "next";
import { NewProjectPage } from "@/features/projects";

export const metadata: Metadata = {
  title: "Add project",
  description: "Create a project and connect a GitHub repository.",
};

export default function Page() {
  return <NewProjectPage />;
}
