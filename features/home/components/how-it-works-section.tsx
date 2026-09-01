"use client";

import { HomeReveal } from "@/features/home/components/home-reveal";
import { HomeSection } from "@/features/home/components/home-section";
import { HomeSectionHeading } from "@/features/home/components/home-section-heading";
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
              <article className="h-full rounded-[1.75rem] border bg-card p-5 shadow-[var(--elevation-whisper)] sm:p-6">
                <p className="text-mono-eyebrow">Step {step.number}</p>
                <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </article>
            </HomeReveal>
          </li>
        ))}
      </ol>
    </HomeSection>
  );
}
