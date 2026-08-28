import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  headingLevel?: "h1" | "h2" | "h3";
};

export function ErrorState({
  title = "Failed to load",
  description = "Please try again or contact support if the problem persists.",
  onRetry,
  headingLevel: Heading = "h2",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <Heading className="text-lg font-medium">{title}</Heading>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
