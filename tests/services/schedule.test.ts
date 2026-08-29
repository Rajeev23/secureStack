import { describe, expect, it } from "vitest";
import {
  isProjectScanDue,
  parseCompanyMonitoring,
  parseProjectMonitoring,
} from "@/services/monitoring/schedule";

describe("parseCompanyMonitoring", () => {
  it("uses defaults for missing or invalid values", () => {
    expect(parseCompanyMonitoring(null)).toEqual({
      scanIntervalHours: 24,
      alertsEnabled: true,
      slackWebhookUrl: null,
      notifyEmail: null,
      digestMode: "off",
      lastDigestAt: null,
    });
    expect(parseCompanyMonitoring({ scanIntervalHours: 3, alertsEnabled: false })).toEqual({
      scanIntervalHours: 24,
      alertsEnabled: false,
      slackWebhookUrl: null,
      notifyEmail: null,
      digestMode: "off",
      lastDigestAt: null,
    });
  });

  it("accepts allowed intervals including off", () => {
    expect(parseCompanyMonitoring({ scanIntervalHours: 0 }).scanIntervalHours).toBe(0);
    expect(parseCompanyMonitoring({ scanIntervalHours: 168 }).scanIntervalHours).toBe(168);
  });
});

describe("parseProjectMonitoring", () => {
  it("defaults to enabled", () => {
    expect(parseProjectMonitoring(null)).toEqual({
      enabled: true,
      environment: "unknown",
      scanMode: "full",
      files: [],
      scanScopeConfigured: true,
    });
    expect(parseProjectMonitoring({ enabled: false })).toEqual({
      enabled: false,
      environment: "unknown",
      scanMode: "full",
      files: [],
      scanScopeConfigured: true,
    });
  });

  it("keeps selected files and treats new-project JSON as unconfigured", () => {
    expect(
      parseProjectMonitoring({
        enabled: true,
        environment: "production",
        scanMode: "selected",
        files: ["package.json", "../secret", "deploy/bom.yaml"],
        scanScopeConfigured: false,
      }),
    ).toEqual({
      enabled: true,
      environment: "production",
      scanMode: "selected",
      files: ["package.json", "deploy/bom.yaml"],
      scanScopeConfigured: false,
    });
  });
});

describe("isProjectScanDue", () => {
  const now = new Date("2026-08-27T12:00:00.000Z");

  it("requires repositories, project enabled, and a positive interval", () => {
    expect(
      isProjectScanDue({
        hasRepositories: false,
        projectEnabled: true,
        intervalHours: 24,
        latest: null,
        now,
      }),
    ).toBe(false);
    expect(
      isProjectScanDue({
        hasRepositories: true,
        projectEnabled: false,
        intervalHours: 24,
        latest: null,
        now,
      }),
    ).toBe(false);
    expect(
      isProjectScanDue({
        hasRepositories: true,
        projectEnabled: true,
        intervalHours: 0,
        latest: null,
        now,
      }),
    ).toBe(false);
    expect(
      isProjectScanDue({
        hasRepositories: true,
        projectEnabled: true,
        intervalHours: 24,
        latest: null,
        now,
      }),
    ).toBe(true);
  });

  it("is due after the interval and sooner after a failed scan", () => {
    expect(
      isProjectScanDue({
        hasRepositories: true,
        projectEnabled: true,
        intervalHours: 24,
        latest: { status: "completed", createdAt: "2026-08-26T12:00:00.000Z", startedAt: null },
        now,
      }),
    ).toBe(true);
    expect(
      isProjectScanDue({
        hasRepositories: true,
        projectEnabled: true,
        intervalHours: 24,
        latest: { status: "completed", createdAt: "2026-08-27T06:00:00.000Z", startedAt: null },
        now,
      }),
    ).toBe(false);
    expect(
      isProjectScanDue({
        hasRepositories: true,
        projectEnabled: true,
        intervalHours: 24,
        latest: { status: "failed", createdAt: "2026-08-27T10:30:00.000Z", startedAt: null },
        now,
      }),
    ).toBe(true);
  });

  it("treats stuck running scans as due after 45 minutes", () => {
    expect(
      isProjectScanDue({
        hasRepositories: true,
        projectEnabled: true,
        intervalHours: 24,
        latest: {
          status: "running",
          createdAt: "2026-08-27T11:00:00.000Z",
          startedAt: "2026-08-27T11:00:00.000Z",
        },
        now,
      }),
    ).toBe(true);
    expect(
      isProjectScanDue({
        hasRepositories: true,
        projectEnabled: true,
        intervalHours: 24,
        latest: {
          status: "running",
          createdAt: "2026-08-27T11:30:00.000Z",
          startedAt: "2026-08-27T11:30:00.000Z",
        },
        now,
      }),
    ).toBe(false);
  });
});
