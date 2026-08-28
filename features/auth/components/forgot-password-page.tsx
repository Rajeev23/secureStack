"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth/client";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth/signup-schema";

export function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const invalidLink = searchParams.get("error") === "invalid";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsSubmitting(true);
    try {
      const response = await requestPasswordReset(values.email);
      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Unable to send reset email.");
        return;
      }
      setSent(true);
      toast.success(data.message ?? "If an account exists for that email, we sent a reset link.");
    } catch {
      toast.error("Unable to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Reset password
          </CardTitle>
          <CardDescription>
            {invalidLink
              ? "That reset link is invalid or has expired. Enter your email to get a new one."
              : "Enter the email on your account. We’ll send a reset link if it exists."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-muted-foreground">
              Check your inbox for a reset link. It may take a minute to arrive.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit(onSubmit)(event);
              }}
              noValidate
              aria-busy={isSubmitting}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="h-11"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
                {errors.email ? (
                  <p id="email-error" role="alert" className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>
              <Button type="submit" size="pill" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
