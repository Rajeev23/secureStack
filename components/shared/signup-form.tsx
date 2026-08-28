"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth/client";
import { signupSchema, type SignupValues } from "@/lib/auth/signup-schema";
import { useUserStore } from "@/features/auth/stores/user-store";

type SignupFormProps = {
  idPrefix?: string;
  submitLabel?: string;
};

export function SignupForm({ idPrefix = "signup", submitLabel = "Create account" }: SignupFormProps) {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: SignupValues) => {
    setIsSubmitting(true);
    try {
      const response = await signUp(values);
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        fieldErrors?: Partial<Record<keyof SignupValues, string[]>>;
        user?: { id: string; name: string; email: string; role: string };
        redirectTo?: string;
        needsEmailConfirmation?: boolean;
      };

      if (!response.ok) {
        const nameMessage = data.fieldErrors?.name?.[0];
        const emailMessage = data.fieldErrors?.email?.[0];
        if (nameMessage) {
          setError("name", { type: "server", message: nameMessage });
        }
        if (emailMessage) {
          setError("email", { type: "server", message: emailMessage });
        }
        toast.error(nameMessage ?? emailMessage ?? data.error ?? "Unable to create account.");
        return;
      }

      if (data.needsEmailConfirmation) {
        toast.success("Check your email to confirm your account, then sign in.");
        router.push("/login?checkEmail=1");
        return;
      }

      if (data.user) setUser(data.user);
      router.push(typeof data.redirectTo === "string" ? data.redirectTo : "/onboarding");
      router.refresh();
    } catch {
      toast.error("Unable to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nameId = `${idPrefix}-name`;
  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;

  return (
    <form
      className="space-y-4"
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(onSubmit)(event);
      }}
      noValidate
      aria-busy={isSubmitting}
    >
      <div className="space-y-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          type="text"
          autoComplete="name"
          className="h-11"
          placeholder="Jane Doe"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${nameId}-error` : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <p id={`${nameId}-error`} role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="email"
          inputMode="email"
          className="h-11"
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id={`${emailId}-error`} role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>Password</Label>
        <InputGroup className="h-11">
          <InputGroupInput
            id={passwordId}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? `${passwordId}-error` : undefined}
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
          <p id={`${passwordId}-error`} role="alert" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">At least 8 characters.</p>
        )}
      </div>

      <Button type="submit" size="pill" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            Creating…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
