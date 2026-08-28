"use client";

import Link from "next/link";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroDots } from "@/components/ui/hero-dots";
import { DashboardCta } from "@/components/shared/dashboard-cta";
import { buttonVariants } from "@/components/ui/button";
import { HeroBackupVisual } from "@/features/home/components/home-mockups";
import { HOME_CTA, HOME_HERO } from "@/features/home/data/copy";
import { cn } from "@/lib/utils";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(8px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.25,
        duration: 0.9,
      },
    },
  },
};

export function HeroSection() {
  return (
    <section
      id={HOME_HERO.id}
      className="relative overflow-hidden px-0 pt-24 pb-12 sm:pt-32 sm:pb-20 md:pt-40 md:pb-28"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <HeroDots />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--background)_28%,transparent)_0%,transparent_52%,var(--background)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16">
          <div className="min-w-0 max-w-2xl">
            <AnimatedGroup variants={transitionVariants}>
              <p className="text-mono-eyebrow">{HOME_HERO.eyebrow}</p>
              <h1 className="mt-3 text-balance text-[1.75rem] leading-[1.15] tracking-tight sm:mt-4 sm:text-5xl md:text-6xl">
                {HOME_HERO.title}
              </h1>
              <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
                {HOME_HERO.body}
              </p>
              <p className="mt-3 text-pretty text-base leading-relaxed text-foreground sm:mt-4 sm:text-lg">
                {HOME_HERO.support}
              </p>
            </AnimatedGroup>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.35,
                    },
                  },
                },
                ...transitionVariants,
              }}
              className="mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:items-center"
            >
              <DashboardCta label={HOME_CTA.primary} className="w-full sm:w-auto" />
              <Link
                href={HOME_CTA.secondaryHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-h-11 w-full rounded-full px-6 sm:w-auto",
                )}
              >
                {HOME_CTA.secondary}
              </Link>
            </AnimatedGroup>
            <p className="mt-3 text-sm text-muted-foreground sm:mt-4">{HOME_HERO.trust}</p>
          </div>

          <div className="min-w-0">
            <HeroBackupVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
