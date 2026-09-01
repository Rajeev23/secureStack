"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutToggle } from "@/components/layout/layout-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function PreferencesSettingsPage() {
  return (
    <div className="dashboard-page">
      <PageHeader
        title="Settings"
        description="Layout and color mode for this device."
      />

      <Card>
        <CardHeader>
          <CardTitle as="h2">Content width</CardTitle>
          <CardDescription>Switch between full-width and contained layouts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Page layout</p>
              <p className="text-sm text-muted-foreground">
                Press <kbd className="rounded border bg-muted px-1.5 font-mono text-xs">⌘B</kbd>{" "}
                or <kbd className="rounded border bg-muted px-1.5 font-mono text-xs">Ctrl+B</kbd>{" "}
                to toggle the sidebar.
              </p>
            </div>
            <LayoutToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Color mode</CardTitle>
          <CardDescription>Light or dark on this device. Brand colors stay fixed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Light / dark</p>
              <p className="text-sm text-muted-foreground">
                Press <kbd className="rounded border bg-muted px-1.5 font-mono text-xs">D</kbd>{" "}
                to toggle from anywhere in the app.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
