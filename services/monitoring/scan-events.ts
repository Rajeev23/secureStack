import type { IntelligenceFindingDraft } from "@/services/intelligence/types";
import { dispatchNotifications, projectDeepLink, type NotificationEvent } from "@/services/monitoring/dispatch";
import type { CompanyMonitoring } from "@/services/monitoring/schedule";

type ScanChangeSlice = {
  newCves?: string[];
  alerts?: Array<{ kind: string; severity: string; summary: string }>;
};

export function notificationsForScan(input: {
  projectId: string;
  projectName: string;
  status: string;
  error?: string | null;
  changes?: ScanChangeSlice | null;
  findings?: IntelligenceFindingDraft[];
}): NotificationEvent[] {
  const url = projectDeepLink(input.projectId);
  const events: NotificationEvent[] = [];

  if (input.status === "failed") {
    events.push({
      title: `Scan failed: ${input.projectName}`,
      body: input.error ?? "SecureStack could not finish this scan.",
      url,
      severity: "high",
    });
    return events;
  }

  const newCves = input.changes?.newCves ?? [];
  const securityAlerts = (input.changes?.alerts ?? []).filter(
    (alert) => alert.kind === "security" || alert.severity === "CRITICAL" || alert.severity === "HIGH",
  );
  const criticalFindings = (input.findings ?? []).filter(
    (finding) => finding.findingType === "SECURITY" && finding.severity === "CRITICAL",
  );

  if (newCves.length || securityAlerts.length) {
    const summary =
      securityAlerts[0]?.summary ??
      (newCves.length ? `${newCves.slice(0, 3).join(", ")} on ${input.projectName}` : "Security update available");
    events.push({
      title: `Security update: ${input.projectName}`,
      body: `${summary}. Open the project for what changed and the recommended version.`,
      url,
      severity: newCves.length || criticalFindings.length ? "critical" : "high",
    });
  }

  if (criticalFindings.length && !events.some((event) => event.severity === "critical")) {
    const finding = criticalFindings[0];
    events.push({
      title: `Critical finding: ${finding?.componentName ?? input.projectName}`,
      body: finding?.recommendation ?? "A critical security finding was detected.",
      url,
      severity: "critical",
    });
  }

  return events;
}

export async function notifyForScan(
  monitoring: CompanyMonitoring,
  events: NotificationEvent[],
): Promise<void> {
  for (const event of events) {
    await dispatchNotifications(monitoring, event);
  }
}
