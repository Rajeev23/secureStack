"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/types/navigation";
import {
  hasActiveDescendant,
  isExactPathActive,
  isNavItemActive,
  isNavSectionActive,
  getNavChildren,
  getNavItemKey,
} from "@/components/layout/sidebar/nav-utils";

/** Left guide rail + indent; right edge matches primary nav (no right sub-menu margin). */
function nestSubMenuClass(nestDepth: number) {
  return cn(
    "mr-0 translate-x-px gap-0.5 border-l border-sidebar-border py-0.5 pl-2.5 pr-0",
    nestDepth === 0 ? "ml-3.5" : "ml-2",
  );
}

function dropdownRowClass(active = false) {
  return cn(
    "relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
    active && "bg-accent font-medium text-accent-foreground",
  );
}

/** Straight left rail for nested dropdown items (matches expanded sidebar). */
function dropdownNestClass() {
  return "ml-3.5 border-l border-border py-0.5 pl-2.5";
}

function NavSubTree({
  items,
  onNavigate,
  nestDepth = 0,
}: {
  items: NavItem[];
  onNavigate?: () => void;
  nestDepth?: number;
}) {
  const pathname = usePathname() ?? "";

  return (
    <SidebarMenuSub className={nestSubMenuClass(nestDepth)}>
      {items.map((item, index) => {
        if (getNavChildren(item).length) {
          return (
            <NavNestedGroup
              key={getNavItemKey(item, index)}
              item={item}
              onNavigate={onNavigate}
              nestDepth={nestDepth}
            />
          );
        }

        if (!item.href) return null;

        const active = isNavItemActive(pathname, item);

        return (
          <SidebarMenuSubItem key={getNavItemKey(item, index)}>
            <SidebarMenuButton
              isActive={active}
              render={
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                />
              }
            >
              {item.icon ? (
                <item.icon
                  className="size-4 shrink-0"
                  aria-hidden
                />
              ) : null}
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuSubItem>
        );
      })}
    </SidebarMenuSub>
  );
}

function NavNestedGroupBody({
  item,
  pathname,
  onNavigate,
  nestDepth = 0,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  nestDepth?: number;
}) {
  const isGroupActive = hasActiveDescendant(pathname, item);
  const [open, setOpen] = useState(isGroupActive);
  const [userToggled, setUserToggled] = useState(false);
  const isOpen = userToggled ? open : isGroupActive;

  return (
    <SidebarMenuSubItem>
      <Collapsible
        open={isOpen}
        onOpenChange={(nextOpen) => {
          setUserToggled(true);
          setOpen(nextOpen);
        }}
      >
        <SidebarMenuButton
          render={
            <CollapsibleTrigger className="outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring" />
          }
        >
          {item.icon ? (
            <item.icon
              className="size-4 shrink-0"
              aria-hidden
            />
          ) : null}
          <span className="truncate">{item.title}</span>
          <ChevronRight
            className={cn(
              "ml-auto size-4 shrink-0 transition-transform",
              isOpen && "rotate-90",
            )}
            aria-hidden
          />
        </SidebarMenuButton>
        <CollapsibleContent>
          <NavSubTree
            items={getNavChildren(item)}
            onNavigate={onNavigate}
            nestDepth={nestDepth + 1}
          />
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuSubItem>
  );
}

function NavNestedGroup({
  item,
  onNavigate,
  nestDepth = 0,
}: {
  item: NavItem;
  onNavigate?: () => void;
  nestDepth?: number;
}) {
  const pathname = usePathname() ?? "";

  return (
    <NavNestedGroupBody
      key={pathname}
      item={item}
      pathname={pathname}
      onNavigate={onNavigate}
      nestDepth={nestDepth}
    />
  );
}

function renderDropdownItems(
  items: NavItem[],
  pathname: string,
  onNavigate: () => void,
  openGroups: Record<string, boolean>,
  onToggleGroup: (groupKey: string, groupActive: boolean) => void,
  groupPath = "",
  inheritedIcon?: NavItem["icon"],
): ReactNode[] {
  return items.flatMap((item, index) => {
    const currentIcon = item.icon ?? inheritedIcon;
    const CurrentIcon = currentIcon;

    if (item.href) {
      const active = isNavItemActive(pathname, item);
      return (
        <DropdownMenuItem
          key={getNavItemKey(item, index)}
          className={cn(dropdownRowClass(active), "gap-2")}
          render={
            <Link href={item.href} onClick={onNavigate}>
              {CurrentIcon ? (
                <CurrentIcon
                  className="size-4 shrink-0"
                  aria-hidden
                />
              ) : null}
              <span className="truncate">{item.title}</span>
            </Link>
          }
        />
      );
    }

    const children = getNavChildren(item);
    if (!children.length) return [];

    const groupActive = hasActiveDescendant(pathname, item);
    const groupKey = `${groupPath}/${getNavItemKey(item, index)}`;
    const isOpen = openGroups[groupKey] ?? groupActive;

    return [
      <button
        type="button"
        key={`trigger-${groupKey}`}
        className={dropdownRowClass(groupActive)}
        onClick={() => onToggleGroup(groupKey, groupActive)}
        aria-expanded={isOpen}
      >
        {CurrentIcon ? (
          <CurrentIcon
            className="size-4 shrink-0"
            aria-hidden
          />
        ) : null}
        <span className="truncate">{item.title}</span>
        <ChevronRight
          className={cn("ml-auto size-4 shrink-0 transition-transform", isOpen && "rotate-90")}
          aria-hidden
        />
      </button>,
      ...(isOpen
        ? [
            <div key={`nest-${groupKey}`} className={dropdownNestClass()}>
              {renderDropdownItems(
                children,
                pathname,
                onNavigate,
                openGroups,
                onToggleGroup,
                groupKey,
                currentIcon,
              )}
            </div>,
          ]
        : []),
    ];
  });
}

function NavCollapsibleItemBody({
  item,
  pathname,
  onNavigate,
  isMobile,
  setOpenMobile,
  sidebarState,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  isMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  sidebarState: "expanded" | "collapsed";
}) {
  const itemChildren = getNavChildren(item);
  const isSectionActive = isNavSectionActive(pathname, item);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const [expanded, setExpanded] = useState(isSectionActive);
  const [openDropdownGroups, setOpenDropdownGroups] = useState<Record<string, boolean>>({});

  const isOpen = userToggled ? expanded : isSectionActive;

  const handleClick = () => {
    if (isMobile) setOpenMobile(false);
    onNavigate?.();
  };

  const toggleDropdownGroup = (groupKey: string, groupActive: boolean) => {
    setOpenDropdownGroups((prev) => ({
      ...prev,
      [groupKey]: !(prev[groupKey] ?? groupActive),
    }));
  };

  if (sidebarState === "collapsed" && !isMobile) {
    return (
      <SidebarMenuItem>
        <DropdownMenu
          open={menuOpen}
          onOpenChange={(open) => {
            setMenuOpen(open);
            if (!open) setOpenDropdownGroups({});
          }}
        >
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                tooltip={menuOpen ? undefined : item.title}
                isActive={isSectionActive}
                aria-label={`${item.title} menu`}
              >
                {item.icon ? (
                  <item.icon className="size-4" aria-hidden />
                ) : null}
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent side="right" align="start" className="min-w-52 px-2 py-1.5">
            {item.href ? (
              <DropdownMenuItem
                className={cn(dropdownRowClass(isExactPathActive(pathname, item.href)), "gap-2")}
                render={
                  <Link href={item.href} onClick={handleClick}>
                    <span className="truncate">{item.title}</span>
                  </Link>
                }
              />
            ) : (
              <div className="px-0.5 py-1.5 text-xs font-medium text-muted-foreground">
                {item.title}
              </div>
            )}
            {renderDropdownItems(
              itemChildren,
              pathname,
              handleClick,
              openDropdownGroups,
              toggleDropdownGroup,
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        open={isOpen}
        onOpenChange={(nextOpen) => {
          setUserToggled(true);
          setExpanded(nextOpen);
        }}
      >
        {item.href ? (
          <>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isExactPathActive(pathname, item.href)}
              render={
                <Link
                  href={item.href}
                  onClick={handleClick}
                  aria-current={isExactPathActive(pathname, item.href) ? "page" : undefined}
                />
              }
            >
              {item.icon ? (
                <item.icon className="size-4 shrink-0" aria-hidden />
              ) : null}
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
            </SidebarMenuButton>
            <CollapsibleTrigger
              render={
                <SidebarMenuAction
                  aria-label={`Show ${item.title}`}
                  aria-expanded={isOpen}
                />
              }
            >
              <ChevronRight
                className={cn("size-4 transition-transform", isOpen && "rotate-90")}
                aria-hidden
              />
            </CollapsibleTrigger>
          </>
        ) : (
          <SidebarMenuButton
            tooltip={item.title}
            render={
              <CollapsibleTrigger className="outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring" />
            }
          >
            {item.icon ? (
              <item.icon className="size-4 shrink-0" aria-hidden />
            ) : null}
            <span className="min-w-0 flex-1 truncate">{item.title}</span>
            <ChevronRight
              className={cn(
                "ml-auto size-4 shrink-0 transition-transform",
                isOpen && "rotate-90",
              )}
              aria-hidden
            />
          </SidebarMenuButton>
        )}
        <CollapsibleContent>
          <NavSubTree items={itemChildren} onNavigate={handleClick} nestDepth={0} />
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

export function NavCollapsibleItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "";
  const { isMobile, setOpenMobile, state } = useSidebar();

  return (
    <NavCollapsibleItemBody
      key={pathname}
      item={item}
      pathname={pathname}
      onNavigate={onNavigate}
      isMobile={isMobile}
      setOpenMobile={setOpenMobile}
      sidebarState={state}
    />
  );
}
