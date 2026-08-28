import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HomeSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  tone?: "default" | "muted";
};

export function HomeSection({
  id,
  children,
  className,
  innerClassName,
  tone = "default",
}: HomeSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 py-16 sm:py-20 md:py-28",
        tone === "muted" && "bg-muted/40",
        className,
      )}
    >
      <div className={cn("mx-auto max-w-6xl px-4 sm:px-6", innerClassName)}>{children}</div>
    </section>
  );
}
