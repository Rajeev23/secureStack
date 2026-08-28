"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { navigationGroups } from "@/config/navigation";
import { useCommandMenuStore } from "@/stores/command-menu-store";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { NavItem } from "@/types/navigation";

function getNavChildren(item: NavItem): NavItem[] {
  return item.items ?? item.children ?? [];
}

function flattenNavItems(items: NavItem[]): { title: string; href: string }[] {
  return items.flatMap((item) => {
    const current = item.href ? [{ title: item.title, href: item.href }] : [];
    const children = flattenNavItems(getNavChildren(item));
    return [...current, ...children];
  });
}

const allPages = navigationGroups.flatMap((group) => flattenNavItems(group.items));

function getShortcutLabel() {
  if (typeof navigator === "undefined") {
    return "Ctrl+K";
  }

  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? "⌘K" : "Ctrl+K";
}

export function CommandMenu() {
  const router = useRouter();
  const { isOpen, setOpen, recentPages, addRecentPage } = useCommandMenuStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setOpen]);

  const navigate = (title: string, href: string) => {
    addRecentPage({ title, href });
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen} showCloseButton>
      <Command>
        <CommandInput placeholder="Search pages, actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {recentPages.length > 0 ? (
            <>
              <CommandGroup heading="Recent">
                {recentPages.map((page) => (
                  <CommandItem
                    key={page.href}
                    onSelect={() => navigate(page.title, page.href)}
                  >
                    {page.title}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          ) : null}
          <CommandGroup heading="Pages">
            {allPages.map((page) => (
              <CommandItem
                key={page.href}
                onSelect={() => navigate(page.title, page.href)}
              >
                {page.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export function CommandMenuTrigger() {
  const { setOpen } = useCommandMenuStore();
  const shortcutLabel = getShortcutLabel();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 text-muted-foreground sm:hidden sm:size-9"
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
      >
        <Search className="size-4" aria-hidden />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="hidden h-8 w-40 cursor-pointer justify-start gap-2 text-muted-foreground sm:inline-flex lg:w-52"
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 text-left text-sm">Search...</span>
        <kbd
          suppressHydrationWarning
          className="pointer-events-none hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline"
        >
          {shortcutLabel}
        </kbd>
      </Button>
    </>
  );
}
