"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  MoreVerticalIcon,
  LogOut,
  Palette,
} from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { getDisplayUser, useUserStore } from "@/features/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function NavUser() {
  const rawUser = useUserStore((state) => state.user);
  const user = getDisplayUser(rawUser);
  const { isMobile } = useSidebar();
  const initials = getInitials(user.name);

  const handleSignOut = () => {
    void signOut();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                aria-label="User menu"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
                <MoreVerticalIcon
                  className="ml-auto size-4 group-data-[collapsible=icon]:hidden"
                  aria-hidden
                />
              </SidebarMenuButton>
            } />
            <DropdownMenuContent className="min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align={isMobile ? "start" : "end"} sideOffset={4}>
              <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer"
                render={<Link href="/settings/account" />}
              >
                <BadgeCheck className="size-4" aria-hidden />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                render={<Link href="/settings/preferences" />}
              >
                <Palette className="size-4" aria-hidden />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                render={<Link href="/settings/preferences" />}
              >
                <Bell className="size-4" aria-hidden />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" aria-hidden />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
