import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginPage } from "@/features/auth/components/login-page";

function LoginFallback() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center bg-muted/30 p-6 outline-none"
      role="status"
      aria-busy="true"
      aria-label="Loading sign in"
    >
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </main>
  );
}

export function LoginPageWithSuspense() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPage />
    </Suspense>
  );
}
