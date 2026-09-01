import { ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

/** Same mark as the sidebar brand — reuse on the public header and footer. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground",
        className,
      )}
    >
      <ScanSearch className="size-4" aria-hidden />
    </div>
  );
}
