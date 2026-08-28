"use client";

import type { ReactNode } from "react";
import { DocCodeBlock } from "@/components/doc-layout/doc-code-block";

type CatalogPreviewProps = {
  id: string;
  title: string;
  purpose: string;
  code: string;
  children: ReactNode;
  notes?: string;
};

export function CatalogPreview({ id, title, purpose, code, children, notes }: CatalogPreviewProps) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-border [&:not(:first-child)]:pt-10">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-[15px] leading-7 text-muted-foreground">{purpose}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-6">
        {children}
      </div>
      <DocCodeBlock language="tsx">{code}</DocCodeBlock>
      {notes ? <p className="text-sm text-muted-foreground">{notes}</p> : null}
    </section>
  );
}
