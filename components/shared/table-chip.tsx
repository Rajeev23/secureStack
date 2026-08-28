import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Dumb cell chip. Pass any CSS color (`#059669`, `rgb(…)`, `var(--link)`).
 * Domain mapping (status → color, true/false → color) belongs at the column.
 */
export function TableChip({
  children,
  leadingDot = false,
  mono = false,
  color,
  filled = false,
  className,
}: {
  children: ReactNode;
  leadingDot?: boolean;
  mono?: boolean;
  color?: string;
  filled?: boolean;
  className?: string;
}) {
  const tintWholeChip = Boolean(filled && color);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-[12px] leading-4",
        !tintWholeChip && "bg-muted text-foreground/80",
        tintWholeChip &&
          "bg-[color-mix(in_srgb,var(--table-chip)_18%,transparent)] text-[var(--table-chip)]",
        mono && "font-mono text-[11px] tracking-tight",
        className,
      )}
      style={color ? ({ "--table-chip": color } as CSSProperties) : undefined}
    >
      {leadingDot ? (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            color ? "bg-[var(--table-chip)]" : "bg-muted-foreground/45",
          )}
          aria-hidden
        />
      ) : null}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
