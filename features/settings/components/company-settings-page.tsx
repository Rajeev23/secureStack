"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { nameSchema } from "@/lib/company/names";
import { useCompanyContextStore } from "@/stores/company-context-store";
import type { CompanyPublic } from "@/server/supabase/types";

const schema = z.object({
  name: nameSchema,
  scanIntervalHours: z.union([
    z.literal(0),
    z.literal(6),
    z.literal(12),
    z.literal(24),
    z.literal(48),
    z.literal(168),
  ]),
  alertsEnabled: z.boolean(),
  slackWebhookUrl: z.string().optional(),
  notifyEmail: z.string().optional(),
  digestMode: z.enum(["off", "daily", "weekly"]),
});

type FormValues = z.infer<typeof schema>;

export function CompanySettingsPage() {
  const hydrateFromApi = useCompanyContextStore((state) => state.hydrateFromApi);
  const [company, setCompany] = useState<CompanyPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanningDue, setScanningDue] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      scanIntervalHours: 24,
      alertsEnabled: true,
      slackWebhookUrl: "",
      notifyEmail: "",
      digestMode: "off",
    },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiGet<{ company: CompanyPublic }>("/api/company");
        if (cancelled) return;
        setCompany(data.company);
        reset({
          name: data.company.name,
          scanIntervalHours: (data.company.scanIntervalHours ?? 24) as FormValues["scanIntervalHours"],
          alertsEnabled: data.company.alertsEnabled !== false,
          slackWebhookUrl: "",
          notifyEmail: data.company.notifyEmail ?? "",
          digestMode: data.company.digestMode ?? "off",
        });
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Unable to load company.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const data = await apiPatch<{ company: CompanyPublic }>("/api/company", {
        name: values.name,
        scanIntervalHours: values.scanIntervalHours,
        alertsEnabled: values.alertsEnabled,
        notifyEmail: values.notifyEmail?.trim() || "",
        digestMode: values.digestMode,
        ...(values.slackWebhookUrl?.trim() ? { slackWebhookUrl: values.slackWebhookUrl.trim() } : {}),
      });
      setCompany(data.company);
      toast.success("Company updated.");
      await hydrateFromApi();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to save company.");
    }
  };

  const onScanDue = async () => {
    setScanningDue(true);
    try {
      const result = await apiPost<{ scanned: Array<{ projectName: string; status: string }>; remaining: number }>(
        "/api/scans/scheduled",
        {},
      );
      const completed = result.scanned.filter((item) => item.status === "completed").length;
      toast.success(
        result.scanned.length
          ? `Scheduled scan ran for ${result.scanned.length} project(s) (${completed} completed). ${result.remaining} remaining.`
          : "No projects are due for a scheduled scan yet.",
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to run scheduled scans.");
    } finally {
      setScanningDue(false);
    }
  };

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Company settings"
        description="Your company is the account that owns projects, scans, findings, and alert destinations."
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading…
        </div>
      ) : company ? (
        <form className="max-w-lg space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="company-name">Company name</Label>
            <Input id="company-name" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="scan-interval">Scheduled scan interval</Label>
            <select
              id="scan-interval"
              className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              {...register("scanIntervalHours", { valueAsNumber: true })}
            >
              <option value={0}>Off (manual scans only)</option>
              <option value={6}>Every 6 hours</option>
              <option value={12}>Every 12 hours</option>
              <option value={24}>Every 24 hours</option>
              <option value={48}>Every 48 hours</option>
              <option value={168}>Every week</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Production uses Vercel Cron hourly and only scans projects that are due. Locally, use Scan due
              projects now.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("alertsEnabled")} />
            Send Slack/email alerts and show What&apos;s changed on the dashboard
          </label>
          <div className="space-y-2">
            <Label htmlFor="slack-webhook">Slack incoming webhook</Label>
            <Input
              id="slack-webhook"
              type="url"
              placeholder={
                company.slackConfigured
                  ? "Webhook saved — paste a new URL to replace"
                  : "https://hooks.slack.com/services/…"
              }
              {...register("slackWebhookUrl")}
            />
            <p className="text-xs text-muted-foreground">
              Fired for new security updates, critical findings, and scan failures. The URL is never shown
              again after save.
            </p>
            {company.slackConfigured ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void apiPatch<{ company: CompanyPublic }>("/api/company", { slackWebhookUrl: "" })
                    .then((data) => {
                      setCompany(data.company);
                      toast.success("Slack webhook removed.");
                    })
                    .catch((error) => {
                      toast.error(error instanceof ApiError ? error.message : "Unable to remove webhook.");
                    });
                }}
              >
                Remove Slack webhook
              </Button>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notify-email">Alert email</Label>
            <Input id="notify-email" type="email" placeholder="security@company.com" {...register("notifyEmail")} />
            <p className="text-xs text-muted-foreground">
              Emails require <code>RESEND_API_KEY</code> and <code>NOTIFY_FROM_EMAIL</code> on the server.
              Slack still works without them.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="digest-mode">Digest</Label>
            <select
              id="digest-mode"
              className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              {...register("digestMode")}
            >
              <option value="off">Off</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <p>
              <span className="text-muted-foreground">Company ID:</span> {company.id}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">GitHub:</span>{" "}
              {company.githubConnected
                ? `Connected${company.githubAccountLogin ? ` as ${company.githubAccountLogin}` : ""}`
                : "Not connected"}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">Created:</span>{" "}
              {new Date(company.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" disabled={scanningDue} onClick={() => void onScanDue()}>
              {scanningDue ? "Scanning…" : "Scan due projects now"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">No company found.</p>
      )}
    </div>
  );
}
