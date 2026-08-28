import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HomeSectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  className?: string;
  align?: "left" | "center";
};

export function HomeSectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "left",
}: HomeSectionHeadingProps) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow ? <p className="text-mono-eyebrow">{eyebrow}</p> : null}
      <h2
        className={cn(
          "max-w-2xl text-balance text-[1.75rem] font-medium tracking-tight sm:text-3xl md:text-4xl",
          eyebrow && "mt-3",
          align === "center" && "mx-auto",
        )}
      >
        {title}
      </h2>
      {description ? (
        <div
          className={cn(
            "mt-4 max-w-2xl space-y-3 text-base leading-relaxed text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          {typeof description === "string" ? <p>{description}</p> : description}
        </div>
      ) : null}
    </div>
  );
}
