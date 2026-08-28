"use client";

import { ErrorState } from "@/components/feedback/ErrorState";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: RootErrorProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center p-6 outline-none"
    >
      <ErrorState
        headingLevel="h1"
        title="Something went wrong"
        description={error.message || "An unexpected error occurred."}
        onRetry={reset}
      />
    </main>
  );
}
