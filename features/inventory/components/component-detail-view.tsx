import Link from "next/link";
import { DependencyTierChip, EnvironmentChip, ImpactChip, PriorityChip } from "@/components/shared/issue-chip";
import { IntelligenceBadges } from "@/features/inventory/components/intelligence-badges";
import { UpdateChangeSections } from "@/features/inventory/components/update-change-sections";
import { projectOverviewHref } from "@/features/projects/model";

export type ComponentDetail = {
  name: string;
  ecosystem: string;
  version: string;
  latestVersion?: string | null;
  versionStatus?: string;
  cves?: string[];
  eolStatus?: string;
  eolDate?: string | null;
  recommendedVersion?: string | null;
  recommendation?: string | null;
  recommendationKind?: string | null;
  hasSecurityFix?: boolean;
  releasedAt?: string | null;
  releaseUrl?: string | null;
  tier?: string | null;
  directParent?: string | null;
  changeSummary?: {
    security: string[];
    bugfix: string[];
    performance: string[];
    breaking: string[];
    other: string[];
  };
  sourceFile: string;
  repository: string;
  projectId?: string;
  projectName?: string;
  applicationName?: string;
  environment?: string | null;
  impact?: string | null;
  impactReasons?: string[];
  priority?: string | null;
  priorityWhy?: string | null;
  slaDays?: number | null;
  slaLabel?: string | null;
};

function formatReleaseDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

type ComponentDetailViewProps = {
  component: ComponentDetail;
  showProjectLink?: boolean;
};

export function ComponentDetailView({ component, showProjectLink = false }: ComponentDetailViewProps) {
  const latest = component.latestVersion;
  const hasUpdate = Boolean(latest && latest !== component.version);
  const cves = [...new Set(component.cves ?? [])];

  return (
    <div className="space-y-4 text-sm">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Current version</dt>
          <dd className="font-medium tabular-nums">{component.version}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">New version</dt>
          <dd className="font-medium tabular-nums">{latest ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Release type</dt>
          <dd className="font-medium capitalize">{component.versionStatus?.replaceAll("_", " ") ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Released</dt>
          <dd className="font-medium">{formatReleaseDate(component.releasedAt) ?? "—"}</dd>
        </div>
        {component.tier ? (
          <div>
            <dt className="text-muted-foreground">Tier</dt>
            <dd className="mt-1">
              <DependencyTierChip tier={component.tier} />
            </dd>
          </div>
        ) : null}
        {component.tier === "transitive" && component.directParent ? (
          <div>
            <dt className="text-muted-foreground">Brought in by</dt>
            <dd className="font-medium">{component.directParent}</dd>
          </div>
        ) : null}
        {component.applicationName || component.projectName ? (
          <div>
            <dt className="text-muted-foreground">Used by</dt>
            <dd className="font-medium">{component.applicationName ?? component.projectName}</dd>
          </div>
        ) : null}
        {component.environment ? (
          <div>
            <dt className="text-muted-foreground">Environment</dt>
            <dd className="mt-1">
              <EnvironmentChip environment={component.environment} />
            </dd>
          </div>
        ) : null}
        {component.impact && component.impact !== "none" ? (
          <div>
            <dt className="text-muted-foreground">Impact</dt>
            <dd className="mt-1">
              <ImpactChip impact={component.impact} />
            </dd>
          </div>
        ) : null}
        {component.priority ? (
          <div>
            <dt className="text-muted-foreground">Priority</dt>
            <dd className="mt-1" title={component.priorityWhy ?? undefined}>
              <PriorityChip priority={component.priority} />
            </dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Source</dt>
          <dd>
            {component.repository ? `${component.repository} / ` : ""}
            {component.sourceFile}
          </dd>
        </div>
      </dl>

      <div>
        <p className="text-muted-foreground">Status</p>
        <div className="mt-1">
          <IntelligenceBadges
            variant="table"
            cves={component.cves}
            versionStatus={component.versionStatus}
            latestVersion={component.latestVersion}
            eolStatus={component.eolStatus}
            recommendationKind={component.recommendationKind}
          />
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="font-medium">What changed?</h2>
        <UpdateChangeSections summary={component.changeSummary} hasUpdate={hasUpdate} />
        {component.releaseUrl ? (
          <a
            href={component.releaseUrl}
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Upstream release notes
          </a>
        ) : null}
      </section>

      <section className="space-y-1">
        <h2 className="font-medium">Security</h2>
        {cves.length ? (
          <>
            <p>This release or the installed version is associated with security fixes.</p>
            <p className="font-mono text-xs">{cves.join(", ")}</p>
          </>
        ) : component.hasSecurityFix ? (
          <p>This release or the installed version is associated with security fixes.</p>
        ) : (
          <p className="text-muted-foreground">No known security fixes in this comparison.</p>
        )}
      </section>

      {component.eolDate ? (
        <p className="text-muted-foreground">End of life: {component.eolDate}</p>
      ) : null}

      {component.slaLabel ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
          {component.slaLabel}
          {component.impactReasons?.length ? ` — ${component.impactReasons.join(". ")}.` : ""}
        </p>
      ) : null}

      <section className="rounded-lg border bg-muted/30 px-3 py-2">
        <h2 className="font-medium">Recommendation</h2>
        <p className="mt-1">
          {component.recommendation ??
            (hasUpdate
              ? `Upgrade ${component.name} from ${component.version} to ${latest}.`
              : "No upgrade recommended from the latest scan.")}
        </p>
      </section>

      {showProjectLink && component.projectId ? (
        <p>
          Used in{" "}
          <Link href={projectOverviewHref(component.projectId)} className="text-primary hover:underline">
            {component.projectName ?? "project"}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
