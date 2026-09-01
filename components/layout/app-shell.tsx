"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { NotFoundProvider, useIsNotFoundPage } from "@/components/feedback/not-found-context";
import { PageSkeleton } from "@/components/feedback/PageSkeleton";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useLayoutStore } from "@/stores/layout-store";
import { useCommandMenuStore } from "@/stores/command-menu-store";
import { getBreadcrumbsFromPath } from "@/lib/breadcrumbs";
import { cn } from "@/lib/utils";

// Restore command palette with the header search trigger:
// import dynamic from "next/dynamic";
// const CommandMenu = dynamic(
//   () => import("@/components/layout/command-menu").then((module) => module.CommandMenu),
//   { ssr: false },
// );

type AppShellProps = {
  children: React.ReactNode;
};

const contentLayoutClasses = {
  full: "w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
  contained: "mx-auto w-full max-w-7xl",
} as const;

function AppShellContent({ children }: AppShellProps) {
  const pathname = usePathname();
  const isNotFound = useIsNotFoundPage();
  const { isOpen, setOpen } = useSidebarStore();
  const { contentLayout } = useLayoutStore();
  const { addRecentPage } = useCommandMenuStore();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    if (isNotFound) return;

    const crumbs = getBreadcrumbsFromPath(pathname ?? "/");
    const current = crumbs[crumbs.length - 1];
    if (current) {
      addRecentPage({ title: current.label, href: current.href ?? pathname ?? "/" });
    }
  }, [pathname, addRecentPage, isNotFound]);

  return (
    <SidebarProvider open={isOpen} onOpenChange={setOpen}>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        {/* Restore command palette (⌘K) with the header search trigger:
        <CommandMenu />
        */}
        <AppHeader />
        <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          <Suspense fallback={<PageSkeleton />}>
            <ErrorBoundary>
              <div
                className={cn(
                  "animate-fade-in flex flex-1 flex-col gap-4 py-4",
                  contentLayout === "contained" && "px-4 sm:px-5",
                  contentLayoutClasses[contentLayout],
                )}
              >
                {children}
              </div>
            </ErrorBoundary>
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <NotFoundProvider>
      <AppShellContent>{children}</AppShellContent>
    </NotFoundProvider>
  );
}
