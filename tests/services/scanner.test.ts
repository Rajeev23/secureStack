import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isVersionCatalogCandidatePath } from "@/services/scanner/manifests";
import { inferTier } from "@/services/scanner/tiers";
import {
  looksLikeVersionCatalog,
  mergeComponents,
  parseCargoToml,
  parseDockerfile,
  parseGoMod,
  parseManifest,
  parsePackageJson,
  parsePackageLock,
  parsePomXml,
  parseRequirementsTxt,
  parseVersionCatalog,
} from "@/services/scanner/parse";

describe("parsePackageJson", () => {
  it("reads declared npm dependencies", () => {
    const components = parsePackageJson(
      JSON.stringify({
        dependencies: { react: "18.3.1", axios: "^1.7.9" },
        devDependencies: { vitest: "^2.1.0" },
      }),
      "package.json",
    );
    expect(components.map((item) => item.name).sort()).toEqual(["axios", "react", "vitest"]);
    expect(components.find((item) => item.name === "axios")?.version).toBe("1.7.9");
  });
});

describe("parsePackageLock", () => {
  it("prefers installed versions from packages", () => {
    const components = parsePackageLock(
      JSON.stringify({
        packages: {
          "": { name: "app" },
          "node_modules/react": { version: "18.3.1" },
          "node_modules/@scope/pkg": { version: "1.2.3" },
        },
      }),
      "package-lock.json",
    );
    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "react", version: "18.3.1", fromLockfile: true }),
        expect.objectContaining({ name: "@scope/pkg", version: "1.2.3" }),
      ]),
    );
  });
});

describe("parseRequirementsTxt", () => {
  it("reads pinned Python packages", () => {
    const components = parseRequirementsTxt("Flask==2.3.0\n# comment\nrequests==2.31.0\n", "requirements.txt");
    expect(components.map((item) => `${item.name}@${item.version}`)).toEqual([
      "flask@2.3.0",
      "requests@2.31.0",
    ]);
  });
});

describe("parseGoMod", () => {
  it("reads require blocks", () => {
    const components = parseGoMod(
      `module example.com/app\n\ngo 1.22\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.1\n)\n`,
      "go.mod",
    );
    expect(components[0]).toMatchObject({
      name: "github.com/gin-gonic/gin",
      version: "1.9.1",
      ecosystem: "go",
    });
  });
});

describe("parseCargoToml", () => {
  it("reads rust crate versions", () => {
    const components = parseCargoToml(
      `[dependencies]\nserde = "1.0"\ntokio = { version = "1.37", features = ["full"] }\n`,
      "Cargo.toml",
    );
    expect(components.map((item) => item.name).sort()).toEqual(["serde", "tokio"]);
  });
});

describe("parsePomXml", () => {
  it("reads maven coordinates", () => {
    const components = parsePomXml(
      `<project><dependencies><dependency><groupId>com.google.guava</groupId><artifactId>guava</artifactId><version>32.1.2-jre</version></dependency></dependencies></project>`,
      "pom.xml",
    );
    expect(components[0]).toMatchObject({
      name: "com.google.guava:guava",
      version: "32.1.2-jre",
      ecosystem: "maven",
    });
  });
});

describe("parseDockerfile", () => {
  it("reads FROM images with tags", () => {
    const components = parseDockerfile("FROM node:20-alpine\nFROM scratch\n", "Dockerfile");
    expect(components).toEqual([
      expect.objectContaining({ name: "node", version: "20-alpine", ecosystem: "docker" }),
    ]);
  });
});

describe("mergeComponents", () => {
  it("lets lockfile versions win", () => {
    const merged = mergeComponents([
      {
        name: "react",
        ecosystem: "npm",
        version: "18.0.0",
        sourceFile: "package.json",
        fromLockfile: false,
        declaredDirect: true,
        tier: "direct",
        upstreamRepo: null,
        directParent: null,
      },
      {
        name: "react",
        ecosystem: "npm",
        version: "18.3.1",
        sourceFile: "package-lock.json",
        fromLockfile: true,
        declaredDirect: false,
        tier: "transitive",
        upstreamRepo: null,
        directParent: null,
      },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].version).toBe("18.3.1");
    expect(merged[0].tier).toBe("direct");
    expect(merged[0].sourceFile).toBe("package.json");
  });

  it("keeps lockfile-only packages as transitive", () => {
    const merged = mergeComponents([
      {
        name: "@babel/helper-globals",
        ecosystem: "npm",
        version: "7.28.0",
        sourceFile: "package-lock.json",
        fromLockfile: true,
        declaredDirect: false,
        tier: "transitive",
        upstreamRepo: null,
        directParent: "next",
      },
    ]);
    expect(merged[0].tier).toBe("transitive");
    expect(merged[0].directParent).toBe("next");
  });
});

describe("parseVersionCatalog", () => {
  it("reads pinned binaries like runc from versions.yaml", () => {
    const components = parseVersionCatalog(
      `runc:
  version: "1.4.2"
  docs: https://github.com/opencontainers/runc/releases
crictl:
  version: "1.35.0"
helm: "3.20.1"
`,
      "versions.yaml",
    );
    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "runc",
          version: "1.4.2",
          ecosystem: "github",
          tier: "infra",
          upstreamRepo: "opencontainers/runc",
        }),
        expect.objectContaining({ name: "crictl", version: "1.35.0", ecosystem: "github", tier: "infra" }),
        expect.objectContaining({ name: "helm", version: "3.20.1", ecosystem: "github", tier: "infra" }),
      ]),
    );
  });

  it("rejects kubernetes manifests that are not version catalogs", () => {
    expect(
      looksLikeVersionCatalog(`apiVersion: v1
kind: ConfigMap
metadata:
  name: versions
`),
    ).toBe(false);
    expect(
      looksLikeVersionCatalog(`runc:
  version: "1.4.2"
  docs: https://github.com/opencontainers/runc/releases
`),
    ).toBe(true);
  });

  it("treats bom.yaml as a version catalog and reads nested components", () => {
    expect(isVersionCatalogCandidatePath("bom.yaml")).toBe(true);
    const components = parseManifest(
      "bom.yaml",
      `containerd:
  version: "1.7.30"
  docs: "https://github.com/containerd/containerd/blob/main/RELEASES.md"
  url: "https://github.com/containerd/containerd/releases/download/v1.7.30/containerd-1.7.30-{{ .OS }}-{{ .Arch }}.tar.gz"
runc:
  version: "1.4.2"
  docs: "https://github.com/opencontainers/runc/releases"
  url: "https://github.com/opencontainers/runc/releases/download/v1.4.2/runc.{{ .Arch }}"
components:
  kubevirt:
    name: KubeVirt
    version: "1.8.1"
    manifest_url: "https://github.com/kubevirt/kubevirt/releases/download/v1.8.1/kubevirt-operator.yaml"
  keycloak:
    name: Keycloak
    images:
      - quay.io/keycloak/keycloak:26.6.3
`,
    );
    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "containerd",
          version: "1.7.30",
          tier: "infra",
          upstreamRepo: "containerd/containerd",
        }),
        expect.objectContaining({
          name: "runc",
          version: "1.4.2",
          tier: "infra",
          upstreamRepo: "opencontainers/runc",
        }),
        expect.objectContaining({
          name: "kubevirt",
          version: "1.8.1",
          tier: "infra",
          upstreamRepo: "kubevirt/kubevirt",
        }),
        expect.objectContaining({ name: "keycloak", version: "26.6.3", tier: "infra" }),
      ]),
    );
    expect(components.some((item) => item.name === "components")).toBe(false);
    expect(components.some((item) => item.name === "platform")).toBe(false);
  });

  it("reads the repo bom.yaml pins including runc and containerd", () => {
    const bom = readFileSync(join(process.cwd(), "bom.yaml"), "utf8");
    const components = parseVersionCatalog(bom, "bom.yaml");
    expect(components.find((item) => item.name === "runc")).toMatchObject({
      version: "1.4.2",
      tier: "infra",
      upstreamRepo: "opencontainers/runc",
    });
    expect(components.find((item) => item.name === "containerd")).toMatchObject({
      version: "1.7.30",
      upstreamRepo: "containerd/containerd",
    });
    expect(components.find((item) => item.name === "crictl")).toMatchObject({ version: "1.35.0" });
    expect(components.find((item) => item.name === "kubernetes")).toMatchObject({ version: "1.35.3" });
    expect(components.length).toBeGreaterThan(15);
  });
});

describe("inferTier", () => {
  it("hides lockfile-only packages even when an old snapshot labeled them direct", () => {
    expect(
      inferTier({
        ecosystem: "npm",
        sourceFile: "package-lock.json",
        tier: "direct",
      }),
    ).toBe("transitive");
    expect(
      inferTier({
        ecosystem: "npm",
        sourceFile: "package.json",
        declaredDirect: true,
      }),
    ).toBe("direct");
    expect(inferTier({ ecosystem: "github" })).toBe("infra");
  });
});
