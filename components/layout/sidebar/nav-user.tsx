"use client";

import Link from "next/link";
import { Eraser, ScanSearch } from "lucide-react";
import { useHydratedScanSession } from "@/features/scan-session/hooks/use-hydrated-scan-session";
import { disconnectGithub } from "@/features/scan-session/hooks/use-scan-session";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

export function NavUser() {
  const { scan, clearScan } = useHydratedScanSession();

  const onClear = () => {
    clearScan();
    void disconnectGithub().catch(() => undefined);
    toast.success("Cleared this session.");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton render={<Link href="/scan" />} tooltip="New scan">
          <ScanSearch className="size-4" aria-hidden />
          <span>New scan</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {scan ? (
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Clear scan"
            onClick={onClear}
          >
            <Eraser className="size-4" aria-hidden />
            <span>Clear scan</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : null}
    </SidebarMenu>
  );
}
