"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import type { NavItem } from "@/types/navigation";
import { getNavChildren, getNavItemKey, isPathActive } from "@/components/layout/sidebar/nav-utils";

type NavLinkItemProps = {
  item: NavItem;
  onNavigate?: () => void;
};

export function NavLinkItem({ item, onNavigate }: NavLinkItemProps) {
  const pathname = usePathname() ?? "";
  const { isMobile, setOpenMobile } = useSidebar();

  if (!item.href) return null;

  const active = !item.external && isPathActive(pathname, item.href);
  const TrailingIcon = item.trailingIcon;

  const handleClick = () => {
    if (isMobile) setOpenMobile(false);
    onNavigate?.();
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={active}
        render={
          <Link
            href={item.href}
            onClick={handleClick}
            aria-current={active ? "page" : undefined}
            {...(item.external
              ? { target: "_blank", rel: "noreferrer noopener" }
              : {})}
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
        {TrailingIcon ? (
          <TrailingIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        ) : null}
        {item.badge ? (
          <Badge variant="secondary" className="ml-auto text-xs">
            {item.badge}
          </Badge>
        ) : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function NavLinkList({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  return (
    <SidebarMenu className="gap-1">
      {items.map((item, index) =>
        getNavChildren(item).length ? null : (
          <NavLinkItem key={getNavItemKey(item, index)} item={item} onNavigate={onNavigate} />
        ),
      )}
    </SidebarMenu>
  );
}
