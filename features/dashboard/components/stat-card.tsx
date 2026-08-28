import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  change: string;
  trend?: "up" | "down" | "neutral";
};

const trendConfig = {
  up: {
    icon: TrendingUp,
    label: "Trending up",
    className: "text-link",
  },
  down: {
    icon: TrendingDown,
    label: "Trending down",
    className: "text-destructive",
  },
  neutral: {
    icon: Minus,
    label: "Stable",
    className: "text-muted-foreground",
  },
} as const;

export function StatCard({
  label,
  value,
  change,
  trend = "neutral",
}: StatCardProps) {
  const { icon: TrendIcon, label: trendLabel, className } = trendConfig[trend];

  return (
    <dl className="feature-card flex flex-col gap-3 p-5">
      <dt className="text-mono-eyebrow">{label}</dt>
      <dd className="font-heading text-2xl font-semibold tabular-nums tracking-[-0.04em] text-foreground sm:text-3xl">
        {value}
      </dd>
      <dd className={cn("flex items-center gap-1.5 text-xs", className)}>
        <TrendIcon className="size-3.5" aria-hidden />
        <span>
          <span className="sr-only">{trendLabel}: </span>
          {change}
        </span>
      </dd>
    </dl>
  );
}
