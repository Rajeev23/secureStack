import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotFoundStateProps = {
  code?: string;
  title?: string;
  description?: string;
};

export function NotFoundState({
  code = "404",
  title = "Page not found",
  description = "The page you are looking for does not exist or may have been moved.",
}: NotFoundStateProps) {
  return (
    <div className="flex min-h-[50vh] flex-1 items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-dashed p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileQuestion className="size-6" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-semibold tracking-tight text-muted-foreground">
            {code}
          </p>
          <h1 className="text-lg font-medium">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Link href="/dashboard" className={cn(buttonVariants())}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
