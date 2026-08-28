"use client";

import { GitBranch, ShieldAlert, ListChecks } from "lucide-react";
import { HomeReveal } from "@/features/home/components/home-reveal";
import { HomeSection } from "@/features/home/components/home-section";
import { HomeSectionHeading } from "@/features/home/components/home-section-heading";
import { HOME_PROBLEM } from "@/features/home/data/copy";

const icons = [GitBranch, ShieldAlert, ListChecks] as const;

export function ProblemSection() {
  return (
    <HomeSection id={HOME_PROBLEM.id}>
      <HomeReveal>
        <HomeSectionHeading title={HOME_PROBLEM.title} description={HOME_PROBLEM.body} />
      </HomeReveal>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {HOME_PROBLEM.points.map((point, index) => {
          const Icon = icons[index];
          return (
            <HomeReveal key={point.title} delay={index * 0.06} className="h-full">
              <article className="flex h-full flex-col rounded-[1.75rem] border bg-card p-5 shadow-[var(--elevation-whisper)] sm:p-6">
                <Icon className="size-5 text-muted-foreground" aria-hidden />
                <h3 className="mt-4 text-lg font-medium">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
              </article>
            </HomeReveal>
          );
        })}
      </div>
    </HomeSection>
  );
}
