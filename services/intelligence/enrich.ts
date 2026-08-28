import { emptyChangeSummary, changeSummaryHasNotes } from "@/services/intelligence/changelog";
import {
  MAX_INTEL_PACKAGES,
  selectIntelBudget,
  uniqueByKey,
  type IntelligenceCoverage,
} from "@/services/intelligence/coverage";
import { scoreUpdateImpact } from "@/services/intelligence/impact";
import type { ProjectEnvironment } from "@/services/monitoring/schedule";
import { lookupEol } from "@/services/intelligence/eol";
import { mapPool } from "@/services/intelligence/http";
import {
  componentOsvKey,
  cveIdFromRecord,
  fixedVersionFromRecord,
  queryOsvForComponents,
  severityFromOsv,
  type OsvQuery,
} from "@/services/intelligence/osv";
import {
  eolRecommendation,
  recommendationKindFor,
  securityRecommendation,
  updateIntelligenceRecommendation,
  updateSeverity,
} from "@/services/intelligence/recommend";
import { lookupLatestVersions } from "@/services/intelligence/registries";
import { lookupReleaseIntel } from "@/services/intelligence/releases";
import type { EnrichedComponent, IntelligenceFindingDraft, VersionStatus } from "@/services/intelligence/types";
import { isDefaultInventoryRow } from "@/services/intelligence/visibility";
import { isOutdated, pickNewerVersion, versionStatus } from "@/services/intelligence/version";
import { inferTier } from "@/services/scanner/tiers";

export { MAX_INTEL_PACKAGES };
export type { IntelligenceCoverage };

type SnapshotComponent = {
  name: string;
  ecosystem: string;
  version: string;
  sourceFile: string;
  repository: string;
  tier?: string;
  upstreamRepo?: string | null;
  directParent?: string | null;
};

export async function enrichComponents(
  components: SnapshotComponent[],
  options: { githubToken?: string; environment?: ProjectEnvironment; applicationName?: string } = {},
): Promise<{
  components: EnrichedComponent[];
  findings: IntelligenceFindingDraft[];
  coverage: IntelligenceCoverage;
}> {
  const unique = uniqueByKey(components, (item) => `${item.ecosystem}:${item.name}`);
  const { selected, coverage } = selectIntelBudget(unique, MAX_INTEL_PACKAGES);
  const uniqueKeys = new Set(selected.map((item) => `${item.ecosystem}:${item.name}`));

  const [latestByKey, osvByKey, eolByComponent] = await Promise.all([
    lookupLatestVersions(
      selected.map((item) => ({
        name: item.name,
        ecosystem: item.ecosystem,
        version: item.version,
        upstreamRepo: item.upstreamRepo,
      })),
      { githubToken: options.githubToken },
    ),
    queryOsvForComponents(
      selected.map(
        (item): OsvQuery => ({
          name: item.name,
          ecosystem: item.ecosystem,
          version: item.version,
          upstreamRepo: item.upstreamRepo,
        }),
      ),
    ),
    lookupEolForComponents(selected),
  ]);

  const releaseLookups = selected.map((component) => {
    const latest = latestByKey.get(`${component.ecosystem}:${component.name}`) ?? null;
    return {
      name: component.name,
      ecosystem: component.ecosystem,
      version: component.version,
      latestVersion: latest,
      versionStatus: versionStatus(component.version, latest),
      upstreamRepo: component.upstreamRepo,
      tier: component.tier,
    };
  });
  const releaseByKey = await lookupReleaseIntel(releaseLookups, { githubToken: options.githubToken });

  const findings: IntelligenceFindingDraft[] = [];
  const enriched: EnrichedComponent[] = [];

  for (const component of components) {
    const key = `${component.ecosystem}:${component.name}`;
    const inBudget = uniqueKeys.has(key);
    const latest = inBudget ? (latestByKey.get(key) ?? null) : null;
    const status = versionStatus(component.version, latest);
    const osvRecords = inBudget
      ? (osvByKey.get(componentOsvKey(component.name, component.ecosystem, component.version)) ?? [])
      : [];
    const eol = inBudget
      ? (eolByComponent.get(componentOsvKey(component.name, component.ecosystem, component.version)) ?? {
          status: "unknown" as const,
          eolDate: null,
          latest: null,
        })
      : { status: "unknown" as const, eolDate: null, latest: null };

    const cves = osvRecords.map((record) => cveIdFromRecord(record));
    const securityTargets = osvRecords.map((record) => fixedVersionFromRecord(record, component.name));
    const recommended =
      pickNewerVersion([...securityTargets, latest, eol.latest]) ?? latest ?? eol.latest;
    const release = inBudget ? (releaseByKey.get(key) ?? null) : null;
    const changeSummary = release?.changeSummary ?? emptyChangeSummary();
    const hasSecurityFix = changeSummary.security.length > 0 || cves.length > 0;
    const tier = inferTier(component);
    const kind = inBudget
      ? recommendationKindFor({
          versionStatus: status,
          hasSecurityFix,
          hasBreaking: changeSummary.breaking.length > 0,
          cveCount: cves.length,
          hasChangeNotes: changeSummaryHasNotes(changeSummary),
        })
      : null;

    const impact = scoreUpdateImpact(
      {
        versionStatus: status,
        recommendationKind: kind,
        hasSecurityFix,
        cves,
        changeSummary,
        releasedAt: release?.releasedAt ?? null,
      },
      {
        environment: options.environment ?? "unknown",
        applicationName: options.applicationName ?? "",
      },
    );

    const row: EnrichedComponent = {
      ...component,
      tier,
      upstreamRepo: component.upstreamRepo ?? null,
      directParent: component.directParent ?? null,
      latestVersion: latest ?? eol.latest,
      versionStatus: status,
      cves,
      eolStatus: eol.status,
      eolDate: eol.eolDate,
      recommendedVersion: recommended,
      recommendation: null,
      recommendationKind: kind,
      hasSecurityFix,
      releasedAt: release?.releasedAt ?? null,
      releaseUrl: release?.releaseUrl ?? null,
      changeSummary,
      ...impact,
    };

    if (kind && latest && isOutdated(component.version, latest)) {
      row.recommendation = updateIntelligenceRecommendation({
        name: component.name,
        current: component.version,
        latest,
        kind,
        versionStatus: status,
        hasSecurityFix,
        hasBreaking: changeSummary.breaking.length > 0,
        changes: changeSummary,
      });
    }

    for (const record of osvRecords) {
      const cve = cveIdFromRecord(record);
      const fixed = fixedVersionFromRecord(record, component.name);
      const text = securityRecommendation({
        name: component.name,
        current: component.version,
        cve,
        fixed,
        latest: latest ?? eol.latest,
      });
      findings.push({
        componentName: component.name,
        ecosystem: component.ecosystem,
        currentVersion: component.version,
        recommendedVersion: fixed ?? latest ?? null,
        findingType: "SECURITY",
        severity: severityFromOsv(record),
        externalReference: cve,
        recommendation: text,
      });
      row.recommendation = row.recommendation ?? text;
    }

    if (osvRecords.length === 0 && inBudget && latest && isOutdated(component.version, latest) && row.recommendation) {
      if (isDefaultInventoryRow(row)) {
        findings.push({
          componentName: component.name,
          ecosystem: component.ecosystem,
          currentVersion: component.version,
          recommendedVersion: latest,
          findingType: "UPDATE",
          severity: updateSeverity(status as VersionStatus),
          externalReference: kind,
          recommendation: row.recommendation,
        });
      }
    }

    if ((eol.status === "eol" || eol.status === "approaching") && tier !== "transitive") {
      const text = eolRecommendation({
        name: component.name,
        current: component.version,
        status: eol.status,
        eolDate: eol.eolDate,
        latest: eol.latest ?? latest,
      });
      findings.push({
        componentName: component.name,
        ecosystem: component.ecosystem,
        currentVersion: component.version,
        recommendedVersion: eol.latest ?? latest,
        findingType: "EOL",
        severity: eol.status === "eol" ? "HIGH" : "MEDIUM",
        externalReference: eol.eolDate,
        recommendation: text,
      });
      row.recommendation = row.recommendation ?? text;
    }

    enriched.push(row);
  }

  return { components: enriched, findings, coverage };
}

async function lookupEolForComponents(components: SnapshotComponent[]) {
  const results = await mapPool(components, 8, async (component) => {
    const eol = await lookupEol(component.name, component.ecosystem, component.version);
    return {
      key: componentOsvKey(component.name, component.ecosystem, component.version),
      eol,
    };
  });
  return new Map(results.map((item) => [item.key, item.eol]));
}
