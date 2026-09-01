"use client";

import Link from "next/link";
import { HomeReveal } from "@/features/home/components/home-reveal";
import { HomeSection } from "@/features/home/components/home-section";
import { HomeSectionHeading } from "@/features/home/components/home-section-heading";
import { buttonVariants } from "@/components/ui/button";
import { HOME_CTA, HOME_SIGNUP } from "@/features/home/data/copy";
import { cn } from "@/lib/utils";

export function SignupSection() {
  return (
    <HomeSection id={HOME_SIGNUP.id} tone="muted">
      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <HomeReveal>
          <HomeSectionHeading title={HOME_SIGNUP.title} description={HOME_SIGNUP.body} />
        </HomeReveal>
        <HomeReveal delay={0.06}>
          <div className="flex flex-col gap-3 rounded-[1.75rem] border bg-card p-5 shadow-[var(--elevation-whisper)] sm:p-6">
            <Link href="/scan" className={cn(buttonVariants({ size: "lg" }), "w-full justify-center")}>
              {HOME_CTA.primary}
            </Link>
            <Link
              href="/documentation"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full justify-center")}
            >
              Read the docs
            </Link>
            <p className="text-sm text-muted-foreground">
              No email. No company setup. Scan, read the report, close the tab.
            </p>
          </div>
        </HomeReveal>
      </div>
    </HomeSection>
  );
}
