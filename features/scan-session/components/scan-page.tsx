"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { GithubScanFlow } from "@/features/scan-session/components/github-scan-flow";
import { ApiError } from "@/lib/api/errors";
import {
  connectGithubWithToken,
  githubConnectHref,
  runSessionScan,
  useGithubSession,
} from "@/features/scan-session/hooks/use-scan-session";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function readAsText(file: File): Promise<string> {
  return file.text();
}

const SCAN_SOURCES = [
  { id: "github", label: "GitHub" },
  { id: "sbom", label: "SBOM" },
  { id: "files", label: "Manifests" },
] as const;

type ScanSource = (typeof SCAN_SOURCES)[number]["id"];

export function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const githubQuery = useGithubSession();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [sbomError, setSbomError] = useState<string | null>(null);
  const [source, setSource] = useState<ScanSource>("github");

  const githubParam = searchParams.get("github");
  const githubReason = searchParams.get("reason");

  const refetchGithub = githubQuery.refetch;

  useEffect(() => {
    if (githubParam === "connected") {
      toast.success("GitHub connected for this session.");
      void refetchGithub();
    }
    if (githubParam === "error") {
      toast.error(
        githubReason === "invalid_state"
          ? "GitHub connection expired. Try again."
          : "GitHub connection failed. Try again.",
      );
    }
  }, [githubParam, githubReason, refetchGithub]);

  const repos = githubQuery.data?.repositories ?? [];
  const connected = Boolean(githubQuery.data?.connected);

  const onSaveToken = async () => {
    setBusy(true);
    try {
      const result = await connectGithubWithToken(token);
      setToken("");
      toast.success(`Connected as ${result.login}.`);
      await githubQuery.refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Unable to use that token."));
    } finally {
      setBusy(false);
    }
  };

  const onSbom = async (file: File | undefined) => {
    if (!file) return;
    setSbomError(null);
    setBusy(true);
    try {
      const text = await readAsText(file);
      const document = JSON.parse(text) as unknown;
      await runSessionScan({ source: "sbom", document });
      toast.success("SBOM scanned.");
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof SyntaxError) {
        setSbomError("Upload CycloneDX or SPDX JSON.");
      } else {
        toast.error(errorMessage(error, "Unable to scan that SBOM."));
      }
    } finally {
      setBusy(false);
    }
  };

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setBusy(true);
    try {
      const files = await Promise.all(
        [...fileList].map(async (file) => ({
          path: file.webkitRelativePath || file.name,
          content: await readAsText(file),
        })),
      );
      await runSessionScan({ source: "files", files });
      toast.success("Files scanned.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(errorMessage(error, "Unable to scan those files."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Scan"
        description="Connect GitHub or drop a file. The report stays in this browser tab. Nothing is written to a database."
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Scan source">
        {SCAN_SOURCES.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={source === item.id ? "default" : "outline"}
            className="h-9 min-w-24 px-4"
            aria-pressed={source === item.id}
            onClick={() => setSource(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {source === "github" ? (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            {connected ? (
              <p className="text-sm text-muted-foreground">
                Connected as <span className="font-medium text-foreground">{githubQuery.data?.login}</span>
                {githubQuery.data?.source === "env"
                  ? " via GITHUB_TOKEN on this server."
                  : ". Token is kept in a short-lived cookie, not a database."}
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Authorize GitHub, or paste a personal access token with repo read access. The token never goes
                  into a database.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button render={<a href={githubConnectHref()} />}>Connect GitHub</Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github-token">Personal access token</Label>
                  <Textarea
                    id="github-token"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="ghp_…"
                    className="min-h-20 font-mono text-sm"
                    autoComplete="off"
                  />
                  <Button type="button" variant="outline" disabled={busy || !token.trim()} onClick={() => void onSaveToken()}>
                    Use token
                  </Button>
                </div>
              </div>
            )}
          </div>

          {githubQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : connected ? (
            <GithubScanFlow
              repos={repos}
              busy={busy}
              setBusy={setBusy}
              onScanned={(label) => {
                toast.success(`Scanned ${label}.`);
                router.push("/dashboard");
              }}
              onError={(error, fallback) => toast.error(errorMessage(error, fallback))}
            />
          ) : null}
        </div>
      ) : null}

      {source === "sbom" ? (
        <div className="rounded-xl border bg-card p-5">
          <Label htmlFor="sbom-file" className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
            <Upload className="size-5 text-muted-foreground" aria-hidden />
            <span className="font-medium">Upload CycloneDX or SPDX JSON</span>
            <span className="text-sm text-muted-foreground">The file is parsed in this request and not saved.</span>
            <Input
              id="sbom-file"
              type="file"
              accept="application/json,.json"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                void onSbom(file);
                event.target.value = "";
              }}
            />
          </Label>
          {sbomError ? <p className="mt-3 text-sm text-destructive">{sbomError}</p> : null}
        </div>
      ) : null}

      {source === "files" ? (
        <div className="rounded-xl border bg-card p-5">
          <Label htmlFor="manifest-files" className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
            <Upload className="size-5 text-muted-foreground" aria-hidden />
            <span className="font-medium">Upload package.json, lockfiles, or bom.yaml</span>
            <span className="text-sm text-muted-foreground">Up to 40 files. Parsed in memory, then discarded.</span>
            <Input
              id="manifest-files"
              type="file"
              multiple
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                void onFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </Label>
        </div>
      ) : null}
    </div>
  );
}
