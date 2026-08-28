"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUpRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/client";
import { useUserStore } from "@/features/auth/stores/user-store";
import { useRedirectIfSignedIn } from "@/features/auth/hooks/use-redirect-if-signed-in";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getSafeRedirectPath(input: string | null, fallback: string): string {
  if (!input || !input.startsWith("/") || input.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(input, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useUserStore((state) => state.setUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const authError = searchParams.get("error");
  const checkEmail = searchParams.get("checkEmail");
  useRedirectIfSignedIn();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await signIn(values.email, values.password);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? "Sign in failed.");
        return;
      }

      if (data.user) {
        setUser(data.user);
      }

      const fallback =
        typeof data.redirectTo === "string" && data.redirectTo.startsWith("/")
          ? data.redirectTo
          : "/dashboard";
      router.push(getSafeRedirectPath(searchParams.get("redirect"), fallback));
      router.refresh();
    } catch {
      toast.error("Unable to sign in. Please try again.");
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
            Sign in
          </CardTitle>
          <CardDescription>
            {checkEmail
              ? "Confirm your email if required, then sign in with the password you created."
              : "Welcome back. Sign in to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            method="post"
            action="/api/auth/login"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit(onSubmit)(event);
            }}
            noValidate
            aria-busy={isSubmitting}
          >
            {authError ? (
              <p role="alert" className="text-sm text-destructive">
                Invalid email or password.
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="h-11"
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

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <InputGroup className="h-11">
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-sm"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {errors.password ? (
                <p id="password-error" role="alert" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button type="submit" size="pill" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create account
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
