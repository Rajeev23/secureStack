"use client";

import { HomeReveal } from "@/features/home/components/home-reveal";
import { HomeSection } from "@/features/home/components/home-section";
import { HomeSectionHeading } from "@/features/home/components/home-section-heading";
import { SignupForm } from "@/components/shared/signup-form";
import { HOME_SIGNUP } from "@/features/home/data/copy";

export function SignupSection() {
  return (
    <HomeSection id={HOME_SIGNUP.id} tone="muted">
      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <HomeReveal>
          <HomeSectionHeading title={HOME_SIGNUP.title} description={HOME_SIGNUP.body} />
        </HomeReveal>
        <HomeReveal delay={0.06}>
          <div className="rounded-[1.75rem] border bg-card p-5 shadow-[var(--elevation-whisper)] sm:p-6">
            <SignupForm idPrefix="home-signup" />
          </div>
        </HomeReveal>
      </div>
    </HomeSection>
  );
}
