import { describe, expect, it } from "vitest";
import { cycleFromVersion, eolProductFor, eolStatusFromCycle } from "@/services/intelligence/eol";
import { cveIdFromRecord, fixedVersionFromRecord, parseCvssScore, severityFromOsv } from "@/services/intelligence/osv";
import {
  eolRecommendation,
  securityRecommendation,
  updateRecommendation,
} from "@/services/intelligence/recommend";
import { findingIdentity } from "@/services/intelligence/identity";
import { compareVersions, isOutdated, versionStatus } from "@/services/intelligence/version";

describe("compareVersions", () => {
  it("orders dotted numeric versions", () => {
    expect(compareVersions("1.7.9", "1.8.2")).toBe(-1);
    expect(compareVersions("18.3.1", "18.3.1")).toBe(0);
    expect(compareVersions("2.0.0", "1.9.9")).toBe(1);
  });

  it("strips v prefixes and ranges", () => {
    expect(compareVersions("v1.2.3", "^1.2.4")).toBe(-1);
  });
});

describe("versionStatus", () => {
  it("classifies patch, minor, and major gaps", () => {
    expect(versionStatus("1.7.9", "1.7.10")).toBe("patch");
    expect(versionStatus("1.7.9", "1.8.2")).toBe("minor");
    expect(versionStatus("1.7.9", "2.0.0")).toBe("major");
    expect(versionStatus("1.8.2", "1.8.2")).toBe("up_to_date");
  });

  it("detects outdated packages", () => {
    expect(isOutdated("1.7.9", "1.8.2")).toBe(true);
    expect(isOutdated("1.8.2", "1.8.2")).toBe(false);
  });
});

describe("OSV record helpers", () => {
  const record = {
    id: "GHSA-xxxx",
    aliases: ["CVE-2024-1234"],
    database_specific: { severity: "HIGH" },
    affected: [
      {
        package: { name: "axios", ecosystem: "npm" },
        ranges: [{ events: [{ introduced: "0" }, { fixed: "1.8.2" }] }],
      },
    ],
  };

  it("prefers CVE aliases for NVD identifiers", () => {
    expect(cveIdFromRecord(record)).toBe("CVE-2024-1234");
  });

  it("reads labeled severity and CVSS numbers", () => {
    expect(severityFromOsv(record)).toBe("HIGH");
    expect(parseCvssScore("9.8")).toBe(9.8);
    expect(severityFromOsv({ id: "X", severity: [{ score: "9.1" }] })).toBe("CRITICAL");
  });

  it("extracts the fixed version", () => {
    expect(fixedVersionFromRecord(record, "axios")).toBe("1.8.2");
  });
});

describe("EOL helpers", () => {
  it("maps docker images to endoflife.date products", () => {
    expect(eolProductFor("node", "docker")).toBe("nodejs");
    expect(eolProductFor("postgres", "docker")).toBe("postgresql");
    expect(eolProductFor("axios", "npm")).toBeNull();
  });

  it("extracts cycles from tags", () => {
    expect(cycleFromVersion("20-alpine", "nodejs")).toBe("20");
    expect(cycleFromVersion("3.12-slim", "python")).toBe("3.12");
  });

  it("flags past and approaching end of life", () => {
    const now = new Date("2026-08-27T00:00:00.000Z");
    expect(eolStatusFromCycle({ cycle: "14", eol: "2024-11-01" }, now).status).toBe("eol");
    expect(eolStatusFromCycle({ cycle: "20", eol: "2026-10-01" }, now).status).toBe("approaching");
    expect(eolStatusFromCycle({ cycle: "22", eol: "2027-04-30" }, now).status).toBe("supported");
  });
});

describe("recommendations", () => {
  it("states the CVE, current version, and upgrade target", () => {
    expect(
      securityRecommendation({
        name: "axios",
        current: "1.7.9",
        cve: "CVE-2024-1234",
        fixed: "1.8.2",
        latest: "1.8.2",
      }),
    ).toBe("Upgrade axios from 1.7.9 to 1.8.2 to address CVE-2024-1234.");
  });

  it("describes update and EOL actions", () => {
    expect(
      updateRecommendation({
        name: "react",
        current: "18.3.1",
        latest: "19.0.0",
        status: "major",
      }),
    ).toContain("19.0.0");
    expect(
      eolRecommendation({
        name: "node",
        current: "18-alpine",
        status: "eol",
        eolDate: "2025-04-30",
        latest: "22.8.0",
      }),
    ).toContain("end of life");
  });
});

describe("findingIdentity", () => {
  it("matches the same component issue across scans", () => {
    const key = findingIdentity({
      componentName: "Axios",
      ecosystem: "npm",
      findingType: "SECURITY",
      externalReference: "CVE-2024-1234",
    });
    expect(
      findingIdentity({
        componentName: "axios",
        ecosystem: "npm",
        findingType: "SECURITY",
        externalReference: "CVE-2024-1234",
      }),
    ).toBe(key);
  });
});
