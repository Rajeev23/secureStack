import type { ScanSnapshot } from "@/server/supabase/types";
import { versionStatus } from "@/services/intelligence/version";

export type ComponentRef = {
  name: string;
  ecosystem: string;
  version: string;
  latestVersion?: string | null;
  versionStatus?: string;
  cves?: string[];
  eolStatus?: string;
};

export type VersionChange = {
  name: string;
  ecosystem: string;
  from: string;
  to: string;
  breaking: boolean;
};

export type ScanAlert = {
  kind: "security" | "update" | "eol" | "resolved" | "breaking";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  summary: string;
};

export type ScanChanges = {
  added: ComponentRef[];
  removed: ComponentRef[];
  updated: VersionChange[];
  newCves: string[];
  resolvedCves: string[];
  alerts: ScanAlert[];
};

function keyOf(component: ComponentRef): string {
  return `${component.ecosystem}:${component.name}`;
}

export function diffSnapshots(
  previous: ScanSnapshot | null | undefined,
  next: Pick<ScanSnapshot, "components">,
): ScanChanges {
  const prevMap = new Map((previous?.components ?? []).map((item) => [keyOf(item), item]));
  const nextMap = new Map(next.components.map((item) => [keyOf(item), item]));

  const added: ComponentRef[] = [];
  const removed: ComponentRef[] = [];
  const updated: VersionChange[] = [];
  const newCves: string[] = [];
  const resolvedCves: string[] = [];
  const alerts: ScanAlert[] = [];

  for (const [key, current] of nextMap) {
    const before = prevMap.get(key);
    if (!before) {
      added.push({
        name: current.name,
        ecosystem: current.ecosystem,
        version: current.version,
        latestVersion: current.latestVersion,
        versionStatus: current.versionStatus,
        cves: current.cves,
        eolStatus: current.eolStatus,
      });
      for (const cve of current.cves ?? []) {
        newCves.push(cve);
        alerts.push({
          kind: "security",
          severity: "HIGH",
          summary: `${current.name} ${current.version} is affected by ${cve}.`,
        });
      }
      if (current.eolStatus === "eol" || current.eolStatus === "approaching") {
        alerts.push({
          kind: "eol",
          severity: current.eolStatus === "eol" ? "HIGH" : "MEDIUM",
          summary: `${current.name} ${current.version} is ${current.eolStatus === "eol" ? "end of life" : "approaching end of life"}.`,
        });
      }
      continue;
    }

    if (before.version !== current.version) {
      const breaking = versionStatus(before.version, current.version) === "major";
      updated.push({
        name: current.name,
        ecosystem: current.ecosystem,
        from: before.version,
        to: current.version,
        breaking,
      });
      if (breaking) {
        alerts.push({
          kind: "breaking",
          severity: "MEDIUM",
          summary: `${current.name} moved from ${before.version} to ${current.version} (major).`,
        });
      }
    }

    const beforeCves = new Set(before.cves ?? []);
    for (const cve of current.cves ?? []) {
      if (!beforeCves.has(cve)) {
        newCves.push(cve);
        alerts.push({
          kind: "security",
          severity: "HIGH",
          summary: `${current.name} ${current.version} is newly affected by ${cve}.`,
        });
      }
    }
    const afterCves = new Set(current.cves ?? []);
    for (const cve of before.cves ?? []) {
      if (!afterCves.has(cve)) {
        resolvedCves.push(cve);
        alerts.push({
          kind: "resolved",
          severity: "INFO",
          summary: `${current.name} is no longer affected by ${cve}.`,
        });
      }
    }

    if (
      (current.eolStatus === "eol" || current.eolStatus === "approaching") &&
      before.eolStatus !== current.eolStatus
    ) {
      alerts.push({
        kind: "eol",
        severity: current.eolStatus === "eol" ? "HIGH" : "MEDIUM",
        summary: `${current.name} ${current.version} is ${current.eolStatus === "eol" ? "end of life" : "approaching end of life"}.`,
      });
    }
  }

  for (const [key, before] of prevMap) {
    if (!nextMap.has(key)) {
      removed.push({
        name: before.name,
        ecosystem: before.ecosystem,
        version: before.version,
      });
    }
  }

  if (!previous) {
    return {
      added,
      removed: [],
      updated: [],
      newCves,
      resolvedCves: [],
      alerts: alerts.filter((alert) => alert.kind === "security" || alert.kind === "eol").slice(0, 20),
    };
  }

  return {
    added,
    removed,
    updated,
    newCves,
    resolvedCves,
    alerts: alerts.slice(0, 40),
  };
}
