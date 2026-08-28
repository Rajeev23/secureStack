"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/shared/signup-form";
import { useRedirectIfSignedIn } from "@/features/auth/hooks/use-redirect-if-signed-in";

export function SignupPage() {
  useRedirectIfSignedIn();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mesh-canvas flex min-h-screen items-center justify-center p-6 outline-none"
    >
      <Card className="w-full max-w-md shadow-[var(--elevation-whisper)]">
        <CardHeader>
          <p className="text-mono-eyebrow mb-2">SecureStack</p>
          <CardTitle as="h1" className="text-2xl tracking-[-0.04em]">
            Create account
          </CardTitle>
          <CardDescription>
            Name, email, and password. Next you’ll name your company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm idPrefix="signup" />

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>

          <p className="mt-3 text-center text-sm">
            <Link href="/" className="font-medium text-primary hover:underline">
              Back to home
            </Link>
          </p>

          <p className="mt-3 text-center text-sm">
            <Link
              href="/documentation"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Documentation
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
