"use client";

import { secondaryNavigation } from "@/config/navigation";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { NavLinkList } from "@/components/layout/sidebar/nav-link-item";

export function NavSecondary() {
  return (
    <nav aria-label="Secondary" className="mt-auto w-full">
      <SidebarGroup>
        <SidebarGroupContent>
          <NavLinkList items={secondaryNavigation} />
        </SidebarGroupContent>
      </SidebarGroup>
    </nav>
  );
}
