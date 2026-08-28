"use client";

import { useEffect, useState } from "react";
import type { DocHeading } from "@/features/documentation/lib/heading";
import { cn } from "@/lib/utils";

export function DocToc({ headings }: { headings: DocHeading[] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    if (!headings.length) return;

    const observers: IntersectionObserver[] = [];
    const visible = new Map<string, boolean>();

    const callback: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        visible.set(entry.target.id, entry.isIntersecting);
      }
      const next = headings.find((heading) => visible.get(heading.id));
      if (next) setActiveId(next.id);
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: "-20% 0px -65% 0px",
      threshold: [0, 1],
    });

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }
    observers.push(observer);

    return () => {
      observers.forEach((item) => item.disconnect());
    };
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav aria-label="On this page" className="space-y-3">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        On this page
      </p>
      <ul className="space-y-1 border-l border-border">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  "block border-l-2 py-1 text-[13px] leading-5 transition-colors",
                  heading.level === 3 ? "pl-4" : "pl-3",
                  active
                    ? "-ml-px border-link font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {heading.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
