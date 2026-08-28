"use client";

import { useEffect } from "react";
import { Building2 } from "lucide-react";
import { useCompanyContextStore } from "@/stores/company-context-store";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function TeamSwitcher() {
  const hydrateFromApi = useCompanyContextStore((state) => state.hydrateFromApi);
  const status = useCompanyContextStore((state) => state.status);
  const company = useCompanyContextStore((state) => state.company);

  useEffect(() => {
    if (status === "idle") {
      void hydrateFromApi();
    }
  }, [hydrateFromApi, status]);

  const label = company?.name ?? (status === "error" ? "SecureStack" : "Loading…");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="size-4" aria-hidden />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{label}</span>
            <span className="truncate text-xs text-muted-foreground">Company</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
