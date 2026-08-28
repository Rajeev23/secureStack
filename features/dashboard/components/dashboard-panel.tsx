import type { ReactNode } from "react";
import Link from "next/link";

export function DashboardPanel({
  title,
  description,
  href,
  hrefLabel = "View all",
  children,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-[var(--elevation-whisper)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {href ? (
          <Link href={href} className="shrink-0 text-xs font-medium text-primary hover:underline">
            {hrefLabel}
          </Link>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
