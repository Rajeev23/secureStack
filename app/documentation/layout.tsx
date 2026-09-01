import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { GithubRepoHeaderLink } from "@/components/shared/github-repo-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "@/styles/docs.css";

export const metadata: Metadata = {
  title: {
    default: "Documentation",
    template: "%s | Documentation",
  },
};

export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/documentation" className="flex items-center gap-2 font-semibold tracking-tight">
            <BookOpen className="size-5" aria-hidden />
            <span>SecureStack docs</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <GithubRepoHeaderLink />
            <Link
              href="/scan"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}
            >
              Scan
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">{children}</div>
    </div>
  );
}
