import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ForgotPasswordPage } from "@/features/auth/components/forgot-password-page";

function ForgotPasswordFallback() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center bg-muted/30 p-6 outline-none"
      role="status"
      aria-busy="true"
      aria-label="Loading password reset"
    >
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </main>
  );
}

export function ForgotPasswordPageWithSuspense() {
  return (
    <Suspense fallback={<ForgotPasswordFallback />}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
