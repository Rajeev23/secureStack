import { isLockfilePath } from "@/services/scanner/manifests";
import type { DetectedComponent, DependencyTier } from "@/services/scanner/types";

export type { DependencyTier };

export function isInfraEcosystem(ecosystem: string | null | undefined): boolean {
  return ecosystem === "github" || ecosystem === "docker";
}

export function inferTier(input: {
  ecosystem?: string | null;
  sourceFile?: string | null;
  fromLockfile?: boolean;
  declaredDirect?: boolean;
  tier?: string | null;
}): DependencyTier {
  if (isInfraEcosystem(input.ecosystem)) return "infra";

  const fromLockfile =
    input.fromLockfile === true || Boolean(input.sourceFile && isLockfilePath(input.sourceFile));
  // Lockfile-only rows stay transitive even if an older snapshot labeled them direct.
  if (fromLockfile && input.declaredDirect !== true) return "transitive";

  if (input.tier === "infra" || input.tier === "direct" || input.tier === "transitive") {
    return input.tier;
  }
  if (input.declaredDirect === true) return "direct";
  if (input.declaredDirect === false) return "transitive";
  return "direct";
}

export function finalizeDetectedTier(item: DetectedComponent): DependencyTier {
  if (isInfraEcosystem(item.ecosystem)) return "infra";
  if (item.declaredDirect) return "direct";
  if (item.fromLockfile) return "transitive";
  return "direct";
}
