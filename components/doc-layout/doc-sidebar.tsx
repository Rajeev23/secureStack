"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  docsNavigation,
  isDocsGroupCollapsible,
  type DocsNavGroup,
  type DocsNavLink,
} from "@/features/documentation/data/docs-nav";
import { cn } from "@/lib/utils";

function isGroupActive(group: DocsNavGroup, pathname: string) {
  return group.items.some((item) => item.href === pathname);
}

function DocsLeafLink({
  item,
  pathname,
  onNavigate,
}: {
  item: DocsNavLink;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = pathname === item.href;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex items-center rounded-md px-2 py-1.5 text-sm no-underline transition-colors",
          active
            ? "bg-muted font-medium text-link visited:text-link"
            : "text-muted-foreground visited:text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        {active ? (
          <span
            className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-link"
            aria-hidden
          />
        ) : null}
        <span className="truncate pl-1">{item.title}</span>
      </Link>
    </li>
  );
}

function DocsFlatGroup({
  group,
  pathname,
  onNavigate,
}: {
  group: DocsNavGroup;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="px-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {group.title}
      </p>
      <ul className="space-y-0.5">
        {group.items.map((item) => (
          <DocsLeafLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  );
}

function DocsCollapsibleGroup({
  group,
  pathname,
  onNavigate,
}: {
  group: DocsNavGroup;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isGroupActive(group, pathname);
  const [open, setOpen] = useState(active);
  const [userToggled, setUserToggled] = useState(false);
  const isOpen = userToggled ? open : active;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setUserToggled(true);
        setOpen(nextOpen);
      }}
    >
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between rounded-md bg-transparent px-2 py-1.5 text-left text-sm font-medium text-foreground outline-hidden transition-colors hover:text-link focus-visible:ring-2 focus-visible:ring-sidebar-ring aria-expanded:text-link">
        <span className="truncate">{group.title}</span>
        <ChevronDown
          className="-rotate-90 size-4 shrink-0 transition-transform group-aria-expanded:rotate-0"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub className="mx-0 ml-2 mr-0 translate-x-0 gap-0.5 border-l border-border py-1 pl-3 pr-0">
          {group.items.map((item) => {
            const itemActive = pathname === item.href;
            return (
              <SidebarMenuSubItem key={item.href}>
                <SidebarMenuSubButton
                  isActive={itemActive}
                  render={
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={itemActive ? "page" : undefined}
                    />
                  }
                  className={cn(
                    "h-8 text-sm",
                    itemActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.title}
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DocSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "/documentation";

  return (
    <nav aria-label="Documentation" className="space-y-5">
      {docsNavigation.map((group) =>
        isDocsGroupCollapsible(group) ? (
          <DocsCollapsibleGroup
            key={group.title}
            group={group}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ) : (
          <DocsFlatGroup
            key={group.title}
            group={group}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ),
      )}
    </nav>
  );
}
