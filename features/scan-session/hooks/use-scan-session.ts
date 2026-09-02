"use client";

import { useQuery } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api/client";
import type { GithubRepo } from "@/services/github/api";
import type { SessionScanResult, SessionScanSource } from "@/services/session-scan/types";
import { useScanSessionStore } from "@/features/scan-session/stores/scan-session-store";

export type GithubSessionStatus = {
  connected: boolean;
  login: string | null;
  source: "cookie" | "env" | null;
  oauthConfigured: boolean;
  repositories: GithubRepo[];
};

export type GithubFileSearch = {
  files: string[];
  truncated: boolean;
  matched: number;
};

export function useGithubSession() {
  return useQuery({
    queryKey: ["session", "github"],
    queryFn: () => apiGet<GithubSessionStatus>("/api/session/github"),
  });
}

export function useSessionGithubRepositoryFiles(
  input: { fullName: string; branch: string; query: string } | null,
) {
  return useQuery({
    queryKey: ["session", "github", "repository-files", input?.fullName, input?.branch, input?.query],
    queryFn: () => fetchSessionGithubFiles(input as { fullName: string; branch: string; query: string }),
    enabled: Boolean(input?.fullName && input?.branch),
    staleTime: 30_000,
    retry: false,
  });
}

async function fetchSessionGithubFiles(input: {
  fullName: string;
  branch: string;
  query: string;
}): Promise<GithubFileSearch> {
  const params = new URLSearchParams({
    fullName: input.fullName,
    branch: input.branch,
  });
  if (input.query) params.set("q", input.query);
  return apiGet<GithubFileSearch>(`/api/session/github/files?${params.toString()}`);
}

export async function connectGithubWithToken(token: string) {
  return apiPost<{ connected: boolean; login: string; source: string }>("/api/session/github", {
    token,
  });
}

export async function disconnectGithub() {
  return apiDelete<{ connected: boolean }>("/api/session/github");
}

export async function runSessionScan(body: {
  source: SessionScanSource;
  fullName?: string;
  branch?: string;
  repositories?: Array<{ fullName: string; branch?: string }>;
  scanMode?: "full" | "selected";
  document?: unknown;
  files?: Array<{ path: string; content: string }> | string[];
}): Promise<SessionScanResult> {
  const response = await apiPost<{ scan: SessionScanResult }>("/api/session/scan", body);
  useScanSessionStore.getState().setScan(response.scan);
  return response.scan;
}

export function githubConnectHref() {
  return "/api/session/github?connect=1&returnTo=/scan";
}
