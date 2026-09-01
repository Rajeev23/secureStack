import type { IntelligenceFindingDraft, EnrichedComponent } from "@/services/intelligence/types";
import type { IntelligenceCoverage } from "@/services/intelligence/coverage";
import type { ScanChanges } from "@/services/intelligence/changes";

export type SessionScanSource = "github" | "sbom" | "files";

/** Keep the GitHub picker and POST /api/session/scan in sync. */
export const MAX_SESSION_GITHUB_REPOS = 8;

export type SessionScanResult = {
  id: string;
  source: SessionScanSource;
  label: string;
  scannedAt: string;
  componentsFound: number;
  findingsFound: number;
  snapshot: {
    repositories: Array<{
      fullName: string;
      branch: string;
      files: string[];
    }>;
    components: EnrichedComponent[];
    coverage?: IntelligenceCoverage;
    changes?: ScanChanges;
  };
  findings: IntelligenceFindingDraft[];
};
