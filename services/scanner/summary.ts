import type { IntelligenceCoverage } from "@/services/intelligence/coverage";
import type { ScanSnapshot } from "@/server/supabase/types";

/** List payloads keep repositories, change alerts, and coverage — never the component tree. */
export function scanListSnapshot(snapshot: ScanSnapshot | null): ScanSnapshot | null {
  if (!snapshot) return null;
  return {
    repositories: snapshot.repositories ?? [],
    components: [],
    changes: snapshot.changes,
    coverage: snapshot.coverage,
  };
}

export function snapshotCoverage(snapshot: ScanSnapshot | null): IntelligenceCoverage | null {
  return snapshot?.coverage ?? null;
}
