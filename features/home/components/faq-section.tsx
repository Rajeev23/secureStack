"use client";

import { ChevronDown } from "lucide-react";
import { HOME_FAQ_HEADING, HOME_FAQS } from "@/features/home/data/copy";
import { HomeReveal } from "@/features/home/components/home-reveal";
import { HomeSection } from "@/features/home/components/home-section";
import { HomeSectionHeading } from "@/features/home/components/home-section-heading";

export function FaqSection() {
  return (
    <HomeSection id="faq">
      <div className="grid min-w-0 gap-8 sm:gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <HomeReveal>
          <HomeSectionHeading title={HOME_FAQ_HEADING} />
        </HomeReveal>
        <HomeReveal delay={0.06}>
          <div className="divide-y overflow-hidden rounded-2xl border bg-card">
            {HOME_FAQS.map((item) => (
              <details key={item.question} className="group px-5 sm:px-6">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-4 text-left text-[0.95rem] font-medium marker:content-none outline-none transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:gap-4 sm:text-base [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="max-w-prose pb-5 text-sm leading-relaxed text-muted-foreground">
                  <p>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </HomeReveal>
      </div>
    </HomeSection>
  );
}
