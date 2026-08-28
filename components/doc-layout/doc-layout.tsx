import type { ReactNode } from "react";
import { DocSidebar } from "@/components/doc-layout/doc-sidebar";
import { DocScrollToTop } from "@/components/doc-layout/doc-scroll-to-top";
import { DocToc } from "@/components/doc-layout/doc-toc";
import type { DocHeading } from "@/features/documentation/lib/heading";

type DocLayoutProps = {
  headings: DocHeading[];
  children: ReactNode;
};

export function DocLayout({ headings, children }: DocLayoutProps) {
  return (
    <div className="relative flex w-full gap-8 xl:gap-12">
      <aside className="sticky top-20 hidden h-fit w-56 shrink-0 self-start pr-2 lg:block">
        <DocSidebar />
      </aside>

      <div className="min-w-0 flex-1">{children}</div>

      <aside className="sticky top-20 hidden h-fit w-52 shrink-0 self-start xl:block">
        <DocToc headings={headings} />
        <DocScrollToTop />
      </aside>
    </div>
  );
}
