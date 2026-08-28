"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CatalogPreview } from "@/features/documentation/catalog/catalog-preview";

export function CatalogOverlays() {
  return (
    <>
      <CatalogPreview
        id="dialog"
        title="Dialog"
        purpose="Modal for a focused task. Always include a title, description, and a clear close path."
        code={`<Dialog>
  <DialogTrigger render={<Button />}>Invite member</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Invite member</DialogTitle>
      <DialogDescription>Send an invite to this workspace.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button>Send invite</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
      >
        <Dialog>
          <DialogTrigger render={<Button />}>Invite member</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite member</DialogTitle>
              <DialogDescription>Send an invite to this workspace.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button>Send invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CatalogPreview>

      <CatalogPreview
        id="sheet"
        title="Sheet"
        purpose="Side drawer for secondary details or mobile filters. Prefer a dialog for short confirmations."
        code={`<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>Open drawer</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Project details</SheetTitle>
      <SheetDescription>Inspect a record without leaving the list.</SheetDescription>
    </SheetHeader>
  </SheetContent>
</Sheet>`}
      >
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>Open drawer</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Project details</SheetTitle>
              <SheetDescription>Inspect a record without leaving the list.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </CatalogPreview>

      <CatalogPreview
        id="dropdown"
        title="Dropdown"
        purpose="A compact menu of actions. Keep destructive items last and visually distinct."
        code={`<DropdownMenu>
  <DropdownMenuTrigger render={<Button variant="outline" />}>
    Actions
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Duplicate</DropdownMenuItem>
    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CatalogPreview>

      <CatalogPreview
        id="tooltip"
        title="Tooltip"
        purpose="Short hint for icon-only controls. Do not put essential information only in a tooltip."
        code={`<Tooltip>
  <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Copy" />}>
    Copy
  </TooltipTrigger>
  <TooltipContent>Copy to clipboard</TooltipContent>
</Tooltip>`}
      >
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>Hover me</TooltipTrigger>
          <TooltipContent>Copy to clipboard</TooltipContent>
        </Tooltip>
      </CatalogPreview>

      <CatalogPreview
        id="toast"
        title="Toast"
        purpose="Transient confirmation. Toasts must not steal focus. Use aria-live via Sonner."
        code={`toast.success("Workspace settings saved.")`}
      >
        <Button
          variant="outline"
          onClick={() => toast.success("Workspace settings saved.")}
        >
          Show toast
        </Button>
      </CatalogPreview>

      <CatalogPreview
        id="command"
        title="Command menu"
        purpose="Keyboard-first search for pages and actions. Open the app palette with ⌘K / Ctrl+K."
        code={`<Command className="rounded-xl border">
  <CommandInput placeholder="Search pages..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Pages">
      <CommandItem>Dashboard</CommandItem>
      <CommandItem>Settings</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`}
      >
        <Command className="w-full max-w-md rounded-xl border">
          <CommandInput placeholder="Search pages..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              <CommandItem>Dashboard</CommandItem>
              <CommandItem>Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CatalogPreview>
    </>
  );
}
