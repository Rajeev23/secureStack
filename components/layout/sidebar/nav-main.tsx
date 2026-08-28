"use client";

import { useMemo } from "react";
import { primaryNavigation } from "@/config/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { NavCollapsibleItem } from "@/components/layout/sidebar/nav-collapsible";
import { NavLinkItem } from "@/components/layout/sidebar/nav-link-item";
import { getNavChildren, getNavItemKey } from "@/components/layout/sidebar/nav-utils";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { withProjectNavItems } from "@/config/project-nav";

export function NavMain() {
  const { data: projects } = useProjects();
  const items = useMemo(
    () => withProjectNavItems(primaryNavigation, projects),
    [projects],
  );

  return (
    <nav aria-label="Primary">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {items.map((item, index) =>
              getNavChildren(item).length ? (
                <NavCollapsibleItem key={getNavItemKey(item, index)} item={item} />
              ) : (
                <NavLinkItem key={getNavItemKey(item, index)} item={item} />
              ),
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </nav>
  );
}
