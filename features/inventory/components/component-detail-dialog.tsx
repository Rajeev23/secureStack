"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ComponentDetailView,
  type ComponentDetail,
} from "@/features/inventory/components/component-detail-view";

export type { ComponentDetail };

type ComponentDetailDialogProps = {
  component: ComponentDetail | null;
  onOpenChange: (open: boolean) => void;
};

export function ComponentDetailDialog({ component, onOpenChange }: ComponentDetailDialogProps) {
  const latest = component?.latestVersion;
  const hasUpdate = Boolean(latest && latest !== component?.version);
  const headingRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [component?.name, component?.version, component?.sourceFile]);

  return (
    <Dialog open={Boolean(component)} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        showCloseButton
        initialFocus={() => headingRef.current}
      >
        {component ? (
          <>
            <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12">
              <div ref={headingRef} tabIndex={-1} className="outline-none">
                <DialogTitle>{component.name}</DialogTitle>
                <DialogDescription>
                  {hasUpdate
                    ? `${component.version} → ${latest}`
                    : `${component.ecosystem}${component.repository ? ` · ${component.repository}` : ""}`}
                </DialogDescription>
              </div>
            </DialogHeader>
            <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <ComponentDetailView component={component} showProjectLink />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
