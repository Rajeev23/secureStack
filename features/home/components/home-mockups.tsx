import type { ReactNode } from "react";
import { Check, FileJson, GitBranch, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { StatusPill } from "@/components/shared/status-pill";
import { cn } from "@/lib/utils";

function ExampleCaption({ children = "Example inventory" }: { children?: string }) {
  return <p className="text-mono-eyebrow">{children}</p>;
}

function MockFrame({
  caption,
  children,
  className,
  label,
}: {
  caption?: string;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <figure
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-2xl border bg-muted/50 p-3 shadow-[var(--elevation-whisper)] sm:rounded-[1.75rem] sm:p-4 lg:p-5",
        className,
      )}
      aria-label={label}
    >
      {caption ? (
        <figcaption className="mb-3">
          <ExampleCaption>{caption}</ExampleCaption>
        </figcaption>
      ) : null}
      {children}
    </figure>
  );
}

function CompactDeviceCard({
  icon: Icon,
  title,
  lines,
}: {
  icon: typeof GitBranch;
  title: string;
  lines: string[];
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-background p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <p className="truncate text-sm font-semibold">{title}</p>
      </div>
      <ul className="mt-2 space-y-0.5 font-mono text-[0.7rem] leading-5 tabular-nums text-muted-foreground">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-2 inline-flex items-center gap-1 text-[0.65rem] font-medium text-emerald-700 dark:text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" aria-hidden />
        Connected
      </p>
    </div>
  );
}

export function HeroBackupVisual() {
  return (
    <MockFrame
      caption="Example health view"
      label="Example of a Git repository scanned for open-source risk"
      className="mx-auto max-w-none lg:max-w-md"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 lg:hidden">
        <CompactDeviceCard icon={GitBranch} title="payments-api" lines={["412 components", "SBOM ready"]} />
        <span className="text-mono-eyebrow px-0.5" aria-hidden>
          →
        </span>
        <CompactDeviceCard icon={ShieldAlert} title="Risk" lines={["18 open CVEs", "6 EOL packages"]} />
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-700 lg:hidden dark:text-emerald-400">
        <Check className="size-4" aria-hidden />
        Inventory ready
      </p>

      <div className="hidden space-y-3 lg:block">
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="size-4 text-muted-foreground" aria-hidden />
              <CardTitle>payments-api</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-mono text-sm tabular-nums text-muted-foreground">412 components</p>
            <p className="font-mono text-sm tabular-nums text-muted-foreground">Git + SBOM</p>
            <StatusPill status="connected" />
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-1 py-1 text-muted-foreground" aria-hidden>
          <span className="h-4 w-px bg-border" />
          <span className="text-mono-eyebrow">Scan</span>
          <span className="h-4 w-px bg-border" />
        </div>

        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-muted-foreground" aria-hidden />
              <CardTitle>Open-source health</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-mono text-sm tabular-nums text-muted-foreground">18 open CVEs</p>
            <p className="font-mono text-sm tabular-nums text-muted-foreground">6 EOL packages</p>
            <ProgressBar value={72} label="Example patch coverage" />
            <StatusPill status="ready" />
          </CardContent>
        </Card>

        <p className="flex items-center justify-center gap-1.5 pt-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="size-4" aria-hidden />
          Priority patches ranked
        </p>
      </div>
    </MockFrame>
  );
}

export function HowItWorksVisual({ step }: { step: 1 | 2 | 3 }) {
  if (step === 1) {
    return (
      <div className="flex items-center justify-center gap-3 text-sm" aria-hidden>
        <DeviceChip icon={GitBranch} label="Git repo" />
        <span className="text-muted-foreground">→</span>
        <DeviceChip icon={FileJson} label="SBOM" />
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex items-center justify-center gap-3 text-sm" aria-hidden>
        <DeviceChip icon={FileJson} label="Components" />
        <span className="text-muted-foreground">→</span>
        <DeviceChip icon={ShieldAlert} label="CVEs / EOL" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5 text-sm" aria-hidden>
      <DeviceChip icon={GitBranch} label="Inventory" />
      <span className="text-muted-foreground">↓</span>
      <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
        SecureStack
      </span>
      <span className="text-muted-foreground">↓</span>
      <DeviceChip icon={ShieldAlert} label="Patch priority" />
      <span className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <Check className="size-3.5" />
        Ranked
      </span>
    </div>
  );
}

function DeviceChip({ icon: Icon, label }: { icon: typeof GitBranch; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
      <Icon className="size-3.5 text-muted-foreground" />
      {label}
    </span>
  );
}
