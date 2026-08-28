import { HomeLayout } from "@/components/layout/home-layout";
import { FaqSection } from "@/features/home/components/faq-section";
import { FeaturesSection } from "@/features/home/components/features-section";
import { HeroSection } from "@/features/home/components/hero-section";
import { HomeFooter } from "@/features/home/components/home-footer";
import { HowItWorksSection } from "@/features/home/components/how-it-works-section";
import { ProblemSection } from "@/features/home/components/problem-section";
import { SignupSection } from "@/features/home/components/signup-section";
import { HOME_CTA } from "@/features/home/data/copy";

export function HomePage() {
  return (
    <HomeLayout primaryCtaLabel={HOME_CTA.primary}>
      <main id="main-content" tabIndex={-1} className="outline-none">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <FaqSection />
        <SignupSection />
      </main>
      <HomeFooter />
    </HomeLayout>
  );
}
