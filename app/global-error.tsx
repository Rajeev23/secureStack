"use client";

import { ErrorState } from "@/components/feedback/ErrorState";
import "@/styles/globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex min-h-screen items-center justify-center p-6 outline-none"
        >
          <ErrorState
            headingLevel="h1"
            title="Application error"
            description={error.message || "An unexpected error occurred."}
            onRetry={reset}
          />
        </main>
      </body>
    </html>
  );
}
