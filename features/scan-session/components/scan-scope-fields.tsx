"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionGithubRepositoryFiles } from "@/features/scan-session/hooks/use-scan-session";
import { MAX_WATCH_FILES } from "@/services/scanner/watch-paths";
import { cn } from "@/lib/utils";

export type SessionScanMode = "full" | "selected";

type SessionScanScopeFieldsProps = {
  fullName: string;
  branch: string;
  scanMode: SessionScanMode;
  files: string[];
  onScanModeChange: (mode: SessionScanMode) => void;
  onFilesChange: (files: string[]) => void;
  allowSelectedFiles?: boolean;
  disabled?: boolean;
};

export function SessionScanScopeFields({
  fullName,
  branch,
  scanMode,
  files,
  onScanModeChange,
  onFilesChange,
  allowSelectedFiles = true,
  disabled = false,
}: SessionScanScopeFieldsProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const searchEnabled = scanMode === "selected" && allowSelectedFiles && Boolean(fullName);
  const filesQuery = useSessionGithubRepositoryFiles(
    searchEnabled ? { fullName, branch: branch || "main", query: debounced } : null,
  );
  const results = filesQuery.data?.files ?? [];
  const selected = new Set(files);

  const addFile = (path: string) => {
    if (selected.has(path) || files.length >= MAX_WATCH_FILES) return;
    onFilesChange([...files, path]);
  };

  const removeFile = (path: string) => {
    onFilesChange(files.filter((item) => item !== path));
  };

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">What should we scan?</legend>
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3",
            scanMode === "full" ? "border-primary bg-muted/40" : "border-transparent hover:bg-muted/40",
          )}
        >
          <input
            type="radio"
            name="session-scan-mode"
            className="mt-1 size-4 accent-primary"
            checked={scanMode === "full"}
            disabled={disabled}
            onChange={() => onScanModeChange("full")}
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              {allowSelectedFiles ? "Entire GitHub repository" : "Entire GitHub repositories"}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Detect known manifests such as package.json, lockfiles, and bom.yaml.
            </span>
          </span>
        </label>
        <label
          className={cn(
            "flex items-start gap-3 rounded-lg border px-3 py-3",
            allowSelectedFiles ? "cursor-pointer" : "cursor-not-allowed opacity-60",
            scanMode === "selected" ? "border-primary bg-muted/40" : "border-transparent hover:bg-muted/40",
          )}
        >
          <input
            type="radio"
            name="session-scan-mode"
            className="mt-1 size-4 accent-primary"
            checked={scanMode === "selected"}
            disabled={disabled || !allowSelectedFiles}
            onChange={() => onScanModeChange("selected")}
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium">Specific files</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {allowSelectedFiles
                ? "Search and pick files — including custom names. Only those files are scanned."
                : "Pick one repository to scan specific files."}
            </span>
          </span>
        </label>
      </fieldset>

      {scanMode === "selected" && allowSelectedFiles ? (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
          {files.length ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Files to scan">
              {files.map((path) => (
                <li key={path}>
                  <span className="inline-flex max-w-full items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs">
                    <span className="truncate">{path}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted"
                      aria-label={`Remove ${path}`}
                      disabled={disabled}
                      onClick={() => removeFile(path)}
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Search by name (package.json, bom.yaml, or a custom file) and add each path you want
              scanned.
            </p>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files in this repository"
              className="pl-8"
              disabled={disabled}
              aria-label="Search repository files"
            />
          </div>

          {filesQuery.isLoading ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
              Searching repository…
            </p>
          ) : filesQuery.isError ? (
            <p className="text-xs text-destructive">Unable to list files. Check GitHub access and try again.</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {debounced
                ? "No matching files. Try another name."
                : "No known dependency files found. Search for a custom filename."}
            </p>
          ) : (
            <ul className="max-h-56 space-y-0.5 overflow-y-auto" aria-label="Search results">
              {results.map((path) => {
                const added = selected.has(path);
                return (
                  <li key={path}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto w-full justify-start py-1.5 font-normal"
                      disabled={disabled || added || files.length >= MAX_WATCH_FILES}
                      onClick={() => addFile(path)}
                    >
                      <span className="truncate">{path}</span>
                      {added ? <span className="ml-auto text-xs text-muted-foreground">Added</span> : null}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          {filesQuery.data?.truncated ? (
            <p className="text-xs text-muted-foreground">More files exist. Narrow the search to find them.</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {files.length}/{MAX_WATCH_FILES} files selected. Only these files are scanned this time. Nothing
            is saved.
          </p>
        </div>
      ) : null}
    </div>
  );
}
