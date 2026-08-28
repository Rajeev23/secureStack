"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const headerIconClass = "size-11 cursor-pointer text-muted-foreground sm:size-8";

export function NotificationBell() {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className={headerIconClass}
                  aria-label="Notifications"
                >
                  <Bell className="size-4" aria-hidden />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b px-4 py-3">
          <PopoverTitle className="text-sm font-medium">Notifications</PopoverTitle>
          <PopoverDescription className="sr-only">
            View recent workspace notifications
          </PopoverDescription>
        </div>
        <div role="status" aria-live="polite" className="px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Wire your notification feed here when you connect an API.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
