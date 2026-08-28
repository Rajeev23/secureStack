"use client";

import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const mounted = useIsClient();
  const hasChildren = children != null && children !== false;

  if (hasChildren) {
    if (mounted) {
      return <>{children}</>;
    }

    return (
      <div
        className="relative inline-block w-fit max-w-full"
        role="status"
        aria-busy="true"
        aria-label="Loading"
        {...props}
      >
        <div className="invisible" aria-hidden suppressHydrationWarning>
          {children}
        </div>
        <div
          data-slot="skeleton"
          className={cn(
            "absolute inset-0 animate-pulse rounded-md bg-muted motion-reduce:animate-none",
            className,
          )}
        />
      </div>
    );
  }

  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-muted motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
