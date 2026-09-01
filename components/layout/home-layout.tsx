"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HOME_CTA, HOME_NAV } from "@/features/home/data/copy";
import { isDocumentationVisible } from "@/config/navigation";
import { cn } from "@/lib/utils";

function HomeBrand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <BrandMark className="size-7" />
      <span>SecureStack</span>
    </Link>
  );
}

function HomeActions({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isDocumentationVisible ? (
        <Link href="/documentation" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Docs
        </Link>
      ) : null}
      <Link href={HOME_CTA.signupHref} className={cn(buttonVariants({ size: "sm" }))}>
        {HOME_CTA.primary}
      </Link>
    </div>
  );
}

export function HomeLayout({
  children,
  primaryCtaLabel = HOME_CTA.primary,
}: {
  children: ReactNode;
  primaryCtaLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <HomeBrand />

          <nav aria-label="Home" className="ml-6 hidden items-center gap-1 md:flex">
            {HOME_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden md:block">
            <HomeActions />
          </div>

          <Sheet>
            <SheetTrigger
              className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "ml-auto md:hidden")}
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>SecureStack</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1" aria-label="Home mobile">
                {HOME_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
              <div className="mt-6">
                <HomeActions className="w-full justify-stretch [&>a]:flex-1" />
              </div>
              <p className="sr-only">{primaryCtaLabel}</p>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      {children}
    </div>
  );
}
