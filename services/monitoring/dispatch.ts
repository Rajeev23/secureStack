import type { CompanyMonitoring } from "@/services/monitoring/schedule";

export type NotificationEvent = {
  title: string;
  body: string;
  url: string;
  severity: "critical" | "high" | "medium" | "info";
};

function appUrl(): string {
  return (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function projectDeepLink(projectId: string): string {
  return `${appUrl()}/projects/${projectId}/overview`;
}

export function dashboardDeepLink(): string {
  return `${appUrl()}/dashboard`;
}

export async function dispatchNotifications(
  monitoring: CompanyMonitoring,
  event: NotificationEvent,
): Promise<{ slack: boolean; email: boolean }> {
  if (!monitoring.alertsEnabled) return { slack: false, email: false };
  const slack = await sendSlack(monitoring.slackWebhookUrl, event);
  const email = await sendEmail(monitoring.notifyEmail, event);
  return { slack, email };
}

async function sendSlack(webhookUrl: string | null, event: NotificationEvent): Promise<boolean> {
  if (!webhookUrl) return false;
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `*${event.title}*\n${event.body}\n${event.url}`,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error(JSON.stringify({ event: "notify.slack", error: error instanceof Error ? error.message : "failed" }));
    return false;
  }
}

async function sendEmail(to: string | null, event: NotificationEvent): Promise<boolean> {
  if (!to) return false;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NOTIFY_FROM_EMAIL?.trim();
  if (!apiKey || !from) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: event.title,
        text: `${event.body}\n\n${event.url}`,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error(JSON.stringify({ event: "notify.email", error: error instanceof Error ? error.message : "failed" }));
    return false;
  }
}
