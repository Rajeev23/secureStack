"use client";

import { LayoutPanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout-store";

export function LayoutToggle({ className }: { className?: string }) {
  const { contentLayout, toggleContentLayout } = useLayoutStore();
  const isContained = contentLayout === "contained";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("text-muted-foreground", className)}
      aria-label={isContained ? "Use full-width layout" : "Use contained layout"}
      aria-pressed={isContained}
      onClick={toggleContentLayout}
    >
      <LayoutPanelLeft className="size-4" aria-hidden />
    </Button>
  );
}
