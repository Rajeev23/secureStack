import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  connected: "Connected",
  scanning: "Scanning",
  ready: "Ready",
};

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-[0.7rem] font-medium text-emerald-700 dark:text-emerald-400",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" aria-hidden />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
