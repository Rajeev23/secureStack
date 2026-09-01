import { describe, expect, it } from "vitest";
import { scoreUpdateImpact } from "@/services/intelligence/impact";
import { parsePurl, parseSbomDocument } from "@/services/intelligence/sbom";
import { parseComposerJson, parseComposerLock, parseGemfile, parseGemfileLock } from "@/services/scanner/parse";

describe("scoreUpdateImpact", () => {
  it("marks a production CVE as P1 with a 7-day SLA", () => {
    const result = scoreUpdateImpact(
      {
        versionStatus: "patch",
        recommendationKind: "update_urgent",
        hasSecurityFix: true,
        cves: ["CVE-2026-1"],
        releasedAt: "2026-07-01T00:00:00.000Z",
      },
      { environment: "production", applicationName: "API", now: new Date("2026-08-28T00:00:00.000Z") },
    );
    expect(result.priority).toBe("P1");
    expect(result.impact).toBe("critical");
    expect(result.slaDays).toBe(7);
    expect(result.priorityWhy).toContain("Why is this P1?");
  });

  it("keeps development patch updates at P4 / low impact", () => {
    const result = scoreUpdateImpact(
      { versionStatus: "patch", recommendationKind: "wait" },
      { environment: "development", applicationName: "API" },
    );
    expect(result.priority).toBe("P4");
    expect(result.impact).toBe("low");
    expect(result.slaDays).toBeNull();
  });
});

describe("SBOM parsers", () => {
  it("reads CycloneDX purls", () => {
    const { format, components } = parseSbomDocument({
      bomFormat: "CycloneDX",
      components: [
        { name: "lodash", version: "4.17.21", purl: "pkg:npm/lodash@4.17.21" },
        { name: "rails", purl: "pkg:gem/rails@7.1.0" },
      ],
    });
    expect(format).toBe("cyclonedx");
    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "lodash", ecosystem: "npm", version: "4.17.21", tier: "direct" }),
        expect.objectContaining({ name: "rails", ecosystem: "rubygems", version: "7.1.0" }),
      ]),
    );
  });

  it("reads SPDX packages with purl refs", () => {
    const { format, components } = parseSbomDocument({
      spdxVersion: "SPDX-2.3",
      packages: [
        {
          name: "symfony/console",
          versionInfo: "6.4.0",
          externalRefs: [{ referenceType: "purl", referenceLocator: "pkg:composer/symfony/console@6.4.0" }],
        },
      ],
    });
    expect(format).toBe("spdx");
    expect(components[0]).toMatchObject({ name: "symfony/console", ecosystem: "composer", version: "6.4.0" });
  });

  it("parses maven purls as group:artifact", () => {
    expect(parsePurl("pkg:maven/org.apache.logging.log4j/log4j-core@2.20.0")).toEqual({
      ecosystem: "maven",
      name: "org.apache.logging.log4j:log4j-core",
      version: "2.20.0",
    });
  });
});

describe("Ruby and Composer manifests", () => {
  it("reads Gemfile pins and Gemfile.lock specs", () => {
    const declared = parseGemfile(`gem "rails", "7.1.3"\ngem 'pg', '~> 1.5.4'\n`, "Gemfile");
    expect(declared).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "rails", version: "7.1.3", declaredDirect: true }),
        expect.objectContaining({ name: "pg", version: "1.5.4" }),
      ]),
    );

    const locked = parseGemfileLock(
      `GEM
  remote: https://rubygems.org/
  specs:
    rails (7.1.3)
      actionpack (= 7.1.3)
    actionpack (7.1.3)

DEPENDENCIES
  rails
`,
      "Gemfile.lock",
    );
    expect(locked.find((item) => item.name === "rails")?.declaredDirect).toBe(true);
    expect(locked.find((item) => item.name === "actionpack")?.tier).toBe("transitive");
  });

  it("reads composer.json and composer.lock", () => {
    const declared = parseComposerJson(
      JSON.stringify({
        require: { php: "^8.3", "symfony/console": "^6.4.2" },
      }),
      "composer.json",
    );
    expect(declared).toEqual([
      expect.objectContaining({ name: "symfony/console", ecosystem: "composer", version: "6.4.2", declaredDirect: true }),
    ]);

    const locked = parseComposerLock(
      JSON.stringify({
        packages: [{ name: "symfony/console", version: "v6.4.2" }],
      }),
      "composer.lock",
    );
    expect(locked[0]).toMatchObject({ name: "symfony/console", version: "6.4.2", fromLockfile: true });
  });
});
