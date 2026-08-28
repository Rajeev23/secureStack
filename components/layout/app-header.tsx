"use client";

import { LogOut, Moon, MoreHorizontal, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CommandMenuTrigger } from "@/components/layout/command-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { signOut } from "@/lib/auth/client";
import { useIsClient } from "@/hooks/use-is-client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const headerIconClass =
  "size-11 cursor-pointer text-muted-foreground sm:size-8";

function HeaderMoreMenu() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useIsClient();
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={headerIconClass}
            aria-label="More actions"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="cursor-pointer"
          disabled={!mounted}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
          {isDark ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => void signOut()}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Single breadcrumb instance: inline on md+, full-width row on small screens
 * (avoids duplicate nav[aria-label=breadcrumb] in the accessibility tree).
 */
export function AppHeader() {
  return (
    <div className="sticky top-0 z-20 shrink-0 bg-background md:rounded-t-xl">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[3.5rem_auto] items-center border-b border-sidebar-border transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:grid-rows-[3.5rem]">
        <div className="col-start-1 row-start-1 flex h-14 items-center pl-4 sm:pl-5">
          <SidebarTrigger
            className="size-11 shrink-0 sm:size-8"
            aria-label="Toggle sidebar"
          />
          <div aria-hidden className="ml-3 hidden h-4 w-px shrink-0 bg-border md:block" />
        </div>

        <div className="col-span-3 row-start-2 min-w-0 border-t border-sidebar-border px-4 py-2.5 sm:px-5 md:col-span-1 md:col-start-2 md:row-start-1 md:border-t-0 md:py-0 md:pr-0 md:pl-4">
          <Breadcrumbs />
        </div>

        <div className="col-start-3 row-start-1 flex items-center justify-end gap-1 pr-4 sm:gap-2 sm:pr-5">
          <CommandMenuTrigger />
          <NotificationBell />
          <div className="hidden items-center gap-1 sm:flex sm:gap-2">
            <ThemeToggle className={headerIconClass} />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-header-action
                    className={`${headerIconClass} hover:bg-transparent`}
                    aria-label="Sign out"
                    onClick={() => void signOut()}
                  >
                    <LogOut className="size-4" aria-hidden />
                  </Button>
                }
              />
              <TooltipContent>Sign out</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1 sm:hidden">
            <HeaderMoreMenu />
          </div>
        </div>
      </header>
    </div>
  );
}
