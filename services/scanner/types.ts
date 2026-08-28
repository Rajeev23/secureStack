export type Ecosystem =
  | "npm"
  | "pypi"
  | "go"
  | "cargo"
  | "maven"
  | "gradle"
  | "docker"
  | "github"
  | "rubygems"
  | "composer";

export type DependencyTier = "infra" | "direct" | "transitive";

export type DetectedComponent = {
  name: string;
  ecosystem: Ecosystem;
  version: string;
  sourceFile: string;
  fromLockfile: boolean;
  declaredDirect: boolean;
  tier: DependencyTier;
  upstreamRepo: string | null;
  directParent: string | null;
};

export type ScanSnapshot = {
  repositories: Array<{
    fullName: string;
    branch: string;
    files: string[];
  }>;
  components: Array<{
    name: string;
    ecosystem: Ecosystem;
    version: string;
    sourceFile: string;
    repository: string;
    tier: DependencyTier;
    upstreamRepo: string | null;
    directParent: string | null;
  }>;
};
