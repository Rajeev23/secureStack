"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appConfig } from "@/config/app";
import { apiGet, apiPost } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { NAME_MAX_LENGTH, nameSchema } from "@/lib/company/names";
import { useCompanyContextStore } from "@/stores/company-context-store";

const formSchema = z.object({
  name: nameSchema,
});

type FormValues = z.infer<typeof formSchema>;

type OnboardingPayload = {
  onboardingStep: "company" | "complete";
  company: { id: string; name: string } | null;
};

export function OnboardingPage() {
  const router = useRouter();
  const hydrateCompany = useCompanyContextStore((state) => state.hydrateFromApi);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiGet<OnboardingPayload>("/api/onboarding");
        if (cancelled) return;
        if (data.onboardingStep === "complete") {
          router.replace("/dashboard");
          return;
        }
        setReady(true);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof ApiError ? error.message : "Unable to load onboarding.");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const data = await apiPost<OnboardingPayload>("/api/onboarding", { name: values.name });
        if (data.onboardingStep === "complete") {
          await hydrateCompany();
          toast.success("Company created.");
          router.replace("/dashboard");
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Unable to continue. Try again.");
      }
    });
  };

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">Couldn’t load onboarding</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </main>
    );
  }

  const busy = isSubmitting || isPending;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 outline-none"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/60 via-background to-background" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {appConfig.name.charAt(0)}
            </span>
            <span className="text-sm font-semibold tracking-tight">{appConfig.name}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
            Welcome to SecureStack
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Name your company to finish setup. Next you will connect a repository so we can watch versions and
            explain what changed.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-[var(--elevation-whisper)]">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={busy}>
            <div className="space-y-2">
              <Label htmlFor="onboarding-name">Company name</Label>
              <Input
                id="onboarding-name"
                autoFocus
                autoComplete="organization"
                maxLength={NAME_MAX_LENGTH}
                placeholder="Acme Technologies"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "onboarding-name-error" : "onboarding-name-hint"}
                {...register("name")}
              />
              {errors.name ? (
                <p id="onboarding-name-error" role="alert" className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              ) : (
                <p id="onboarding-name-hint" className="text-sm text-muted-foreground">
                  The first user becomes Admin for this company.
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" size="pill" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                  Saving…
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
