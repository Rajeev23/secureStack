"use client";

import { useMemo, useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SessionScanScopeFields,
  type SessionScanMode,
} from "@/features/scan-session/components/scan-scope-fields";
import { runSessionScan } from "@/features/scan-session/hooks/use-scan-session";
import type { GithubRepo } from "@/services/github/api";
import { MAX_SESSION_GITHUB_REPOS } from "@/services/session-scan/types";
import { cn } from "@/lib/utils";

type GithubScanFlowProps = {
  repos: GithubRepo[];
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onScanned: (label: string) => void;
  onError: (error: unknown, fallback: string) => void;
};

export function GithubScanFlow({ repos, busy, setBusy, onScanned, onError }: GithubScanFlowProps) {
  const [query, setQuery] = useState("");
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [step, setStep] = useState<"repos" | "scope">("repos");
  const [scanMode, setScanMode] = useState<SessionScanMode>("full");
  const [files, setFiles] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return repos;
    return repos.filter((repo) => repo.fullName.toLowerCase().includes(needle));
  }, [query, repos]);

  const selected = useMemo(
    () =>
      selectedNames
        .map((name) => repos.find((repo) => repo.fullName === name))
        .filter((repo): repo is GithubRepo => Boolean(repo)),
    [repos, selectedNames],
  );

  const allowSelectedFiles = selected.length === 1;
  const scopeRepo = selected[0] ?? null;

  const toggleRepo = (fullName: string) => {
    setSelectedNames((current) => {
      if (current.includes(fullName)) return current.filter((name) => name !== fullName);
      if (current.length >= MAX_SESSION_GITHUB_REPOS) {
        toast.error(`Scan at most ${MAX_SESSION_GITHUB_REPOS} repositories at a time.`);
        return current;
      }
      return [...current, fullName];
    });
    setFiles([]);
    setScanMode("full");
  };

  const onScan = async () => {
    if (selected.length === 0) return;
    if (scanMode === "selected" && files.length === 0) {
      toast.error("Select at least one file to scan.");
      return;
    }
    setBusy(true);
    try {
      await runSessionScan({
        source: "github",
        repositories: selected.map((repo) => ({
          fullName: repo.fullName,
          branch: repo.defaultBranch,
        })),
        scanMode,
        files: scanMode === "selected" ? files : undefined,
      });
      onScanned(
        selected.length === 1 ? selected[0]!.fullName : `${selected.length} repositories`,
      );
    } catch (error) {
      onError(error, "Unable to scan those repositories.");
    } finally {
      setBusy(false);
    }
  };

  if (step === "scope") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Scanning{" "}
            <span className="font-medium text-foreground">
              {selected.map((repo) => repo.fullName).join(", ")}
            </span>
          </p>
        </div>
        {scopeRepo ? (
          <SessionScanScopeFields
            fullName={scopeRepo.fullName}
            branch={scopeRepo.defaultBranch}
            scanMode={scanMode}
            files={files}
            onScanModeChange={setScanMode}
            onFilesChange={setFiles}
            allowSelectedFiles={allowSelectedFiles}
            disabled={busy}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => setStep("repos")}>
            Back
          </Button>
          <Button
            type="button"
            disabled={busy || selected.length === 0 || (scanMode === "selected" && files.length === 0)}
            onClick={() => void onScan()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {selected.length === 1 ? `Scan ${selected[0]!.fullName}` : `Scan ${selected.length} repositories`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search repositories"
        aria-label="Search repositories"
      />
      <ul className="max-h-80 overflow-y-auto rounded-xl border bg-card" aria-label="GitHub repositories">
        {filtered.length ? (
          filtered.map((repo) => {
            const checked = selectedNames.includes(repo.fullName);
            return (
              <li key={repo.id}>
                <label
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50",
                    checked && "bg-muted/70",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary"
                    checked={checked}
                    disabled={busy}
                    onChange={() => toggleRepo(repo.fullName)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{repo.fullName}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <GitBranch className="size-3" aria-hidden />
                      {repo.defaultBranch}
                      {repo.private ? " · private" : ""}
                    </span>
                  </span>
                </label>
              </li>
            );
          })
        ) : (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">No repositories match.</li>
        )}
      </ul>
      <p className="text-xs text-muted-foreground">
        {selected.length
          ? `${selected.length} selected${selected.length >= MAX_SESSION_GITHUB_REPOS ? ` (max ${MAX_SESSION_GITHUB_REPOS})` : ""}.`
          : "Select one or more repositories, then choose a full scan or specific files."}
      </p>
      <Button type="button" disabled={selected.length === 0 || busy} onClick={() => setStep("scope")}>
        Continue
      </Button>
    </div>
  );
}
