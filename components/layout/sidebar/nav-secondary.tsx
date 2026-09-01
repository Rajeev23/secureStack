"use client";

import { secondaryNavigation, visibleNavItems } from "@/config/navigation";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { NavLinkList } from "@/components/layout/sidebar/nav-link-item";

export function NavSecondary() {
  const items = visibleNavItems(secondaryNavigation);
  if (items.length === 0) return null;

  return (
    <nav aria-label="Secondary" className="mt-auto w-full">
      <SidebarGroup>
        <SidebarGroupContent>
          <NavLinkList items={items} />
        </SidebarGroupContent>
      </SidebarGroup>
    </nav>
  );
}
