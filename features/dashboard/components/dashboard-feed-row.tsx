import type { ReactNode } from "react";
import Link from "next/link";

export function DashboardFeedRow({
  href,
  title,
  subtitle,
  chips,
}: {
  href: string;
  title: string;
  subtitle?: string;
  chips: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 rounded-md py-2.5 text-sm transition-colors hover:bg-muted/50"
      >
        <span className="min-w-0">
          <span className="font-medium">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-muted-foreground">{subtitle}</span>
          ) : null}
        </span>
        <span className="flex shrink-0 flex-wrap items-center justify-end gap-1">{chips}</span>
      </Link>
    </li>
  );
}
