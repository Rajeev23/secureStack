"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth/client";
import { passwordSchema } from "@/lib/auth/signup-schema";

const schema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await resetPassword(values.password);
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };
      if (!response.ok) {
        toast.error(data.error ?? "Unable to update password.");
        return;
      }
      toast.success("Password updated. You can continue.");
      router.push(typeof data.redirectTo === "string" ? data.redirectTo : "/dashboard");
      router.refresh();
    } catch {
      toast.error("Unable to update password. Please try again.");
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
            Choose a new password
          </CardTitle>
          <CardDescription>
            Use the link from your email, then set a password of at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="password">New password</Label>
              <InputGroup className="h-11">
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
              ) : (
                <p className="text-sm text-muted-foreground">At least 8 characters.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <InputGroup className="h-11">
                <InputGroupInput
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword ? "confirm-password-error" : undefined
                  }
                  {...register("confirmPassword")}
                />
              </InputGroup>
              {errors.confirmPassword ? (
                <p id="confirm-password-error" role="alert" className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="pill" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                  Updating…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Need a new link?{" "}
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              Request reset
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
