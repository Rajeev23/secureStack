"use client";

import { HomeReveal } from "@/features/home/components/home-reveal";
import { HomeSection } from "@/features/home/components/home-section";
import { HomeSectionHeading } from "@/features/home/components/home-section-heading";
import { HowItWorksVisual } from "@/features/home/components/home-mockups";
import { HOME_HOW_IT_WORKS } from "@/features/home/data/copy";

export function HowItWorksSection() {
  return (
    <HomeSection id={HOME_HOW_IT_WORKS.id} tone="muted">
      <HomeReveal>
        <HomeSectionHeading title={HOME_HOW_IT_WORKS.title} />
      </HomeReveal>

      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {HOME_HOW_IT_WORKS.steps.map((step, index) => (
          <li key={step.number} className="h-full">
            <HomeReveal delay={index * 0.06} className="h-full">
              <article className="flex h-full flex-col rounded-[1.75rem] border bg-card p-5 shadow-[var(--elevation-whisper)] sm:p-6">
                <p className="text-mono-eyebrow">Step {step.number}</p>
                <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
                <div className="mt-6 rounded-xl border bg-muted/50 px-3 py-4">
                  <HowItWorksVisual step={(index + 1) as 1 | 2 | 3} />
                </div>
              </article>
            </HomeReveal>
          </li>
        ))}
      </ol>

      <HomeReveal delay={0.12}>
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {HOME_HOW_IT_WORKS.footer}
        </p>
      </HomeReveal>
    </HomeSection>
  );
}
