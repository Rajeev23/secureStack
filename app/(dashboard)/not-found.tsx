import type { Metadata } from "next";
import { NotFoundMarker } from "@/components/feedback/not-found-context";
import { NotFoundState } from "@/components/feedback/not-found-state";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested page could not be found.",
};

export default function DashboardNotFound() {
  return (
    <div className="dashboard-page">
      <NotFoundMarker />
      <NotFoundState />
    </div>
  );
}
