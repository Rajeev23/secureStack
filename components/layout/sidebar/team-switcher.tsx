"use client";

import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
          <BrandMark />
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">SecureStack</span>
            {/* Restore session caption when we want it under the brand:
            const caption = scan ? "This browser session" : "No data stored";
            <span className="truncate text-xs text-muted-foreground">{caption}</span>
            */}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
