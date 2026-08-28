import type { Metadata } from "next";
import { ProjectsPage } from "@/features/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Applications and the GitHub repository monitored by SecureStack.",
};

export default function Page() {
  return <ProjectsPage />;
}
