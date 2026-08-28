"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DocSidebar } from "@/components/doc-layout/doc-sidebar";

export function DocMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="outline" size="sm" className="gap-1.5">
              <Menu className="size-3.5" aria-hidden />
              Docs menu
            </Button>
          }
        />
        <SheetContent side="left" className="w-[min(20rem,90vw)] p-0">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Documentation</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-3 py-4">
            <DocSidebar onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
