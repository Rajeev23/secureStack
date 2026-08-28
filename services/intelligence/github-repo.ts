import { fetchJson } from "@/services/intelligence/http";

/** Common infrastructure binaries pinned in bom.yaml / versions.yaml / tools.yaml. */
const GITHUB_COMPONENT_REPOS: Record<string, string> = {
  runc: "opencontainers/runc",
  crictl: "kubernetes-sigs/cri-tools",
  "cri-tools": "kubernetes-sigs/cri-tools",
  cri_tools: "kubernetes-sigs/cri-tools",
  cni_plugins: "containernetworking/plugins",
  "cni-plugins": "containernetworking/plugins",
  helm: "helm/helm",
  containerd: "containerd/containerd",
  nerdctl: "containerd/nerdctl",
  buildkit: "moby/buildkit",
  compose: "docker/compose",
  etcd: "etcd-io/etcd",
  kubectl: "kubernetes/kubernetes",
  kubelet: "kubernetes/kubernetes",
  kubeadm: "kubernetes/kubernetes",
  kubernetes: "kubernetes/kubernetes",
  kubevirt: "kubevirt/kubevirt",
  cdi: "kubevirt/containerized-data-importer",
  cilium: "cilium/cilium",
  rook_ceph: "rook/rook",
  rook: "rook/rook",
  cert_manager: "cert-manager/cert-manager",
  "cert-manager": "cert-manager/cert-manager",
  metallb: "metallb/metallb",
  temporal: "temporalio/temporal",
  keycloak: "keycloak/keycloak",
  openbao: "openbao/openbao",
  cloudnative_pg: "cloudnative-pg/cloudnative-pg",
  kube_vip: "kube-vip/kube-vip",
  "kube-vip": "kube-vip/kube-vip",
  ingress_nginx: "kubernetes/ingress-nginx",
  "ingress-nginx": "kubernetes/ingress-nginx",
  spicedb: "authzed/spicedb",
  spire: "spiffe/spire",
  cosign: "sigstore/cosign",
  kata: "kata-containers/kata-containers",
  fluentbit: "fluent/fluent-bit",
  "fluent-bit": "fluent/fluent-bit",
  harbor: "goharbor/harbor",
  multus: "k8snetworkplumbingwg/multus-cni",
};

type NpmPackument = {
  repository?: { url?: string; type?: string } | string;
};

export function githubRepoFromName(name: string, ecosystem: string): string | null {
  const key = name.trim().toLowerCase();
  if (GITHUB_COMPONENT_REPOS[key]) return GITHUB_COMPONENT_REPOS[key];
  const dashed = key.replaceAll("_", "-");
  if (GITHUB_COMPONENT_REPOS[dashed]) return GITHUB_COMPONENT_REPOS[dashed];

  if (ecosystem === "go" && key.startsWith("github.com/")) {
    const parts = name.split("/");
    if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
  }

  return parseGithubRepoUrl(name);
}

export function parseGithubRepoUrl(value: string): string | null {
  const match = /github\.com[:/]+([^/\s]+\/[^/\s]+?)(?:\.git)?(?:[/#?]|$)/i.exec(value.trim());
  if (!match?.[1]) return null;
  const [owner, repo] = match[1].split("/");
  if (!owner || !repo) return null;
  return `${owner}/${repo.replace(/\.git$/i, "")}`;
}

export async function githubRepoForComponent(
  name: string,
  ecosystem: string,
  upstreamRepo?: string | null,
): Promise<string | null> {
  if (upstreamRepo) {
    const parsed = parseGithubRepoUrl(upstreamRepo);
    if (parsed) return parsed;
    if (/^[^/\s]+\/[^/\s]+$/.test(upstreamRepo.trim())) return upstreamRepo.trim();
  }
  const direct = githubRepoFromName(name, ecosystem);
  if (direct) return direct;
  if (ecosystem !== "npm") return null;

  const encoded = name.replace("/", "%2f");
  const json = await fetchJson<NpmPackument>(`https://registry.npmjs.org/${encoded}`);
  const url = typeof json?.repository === "string" ? json.repository : json?.repository?.url;
  return url ? parseGithubRepoUrl(url) : null;
}
