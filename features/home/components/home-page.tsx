import { HomeLayout } from "@/components/layout/home-layout";
import { GithubRepoHeaderLink } from "@/components/shared/github-repo-link";
import { FaqSection } from "@/features/home/components/faq-section";
import { HeroSection } from "@/features/home/components/hero-section";
import { HomeFooter } from "@/features/home/components/home-footer";
import { HowItWorksSection } from "@/features/home/components/how-it-works-section";
import { HOME_CTA } from "@/features/home/data/copy";

export async function HomePage() {
  return (
    <HomeLayout githubLink={<GithubRepoHeaderLink />} primaryCtaLabel={HOME_CTA.primary}>
      <main id="main-content" tabIndex={-1} className="outline-none">
        <HeroSection />
        <HowItWorksSection />
        <FaqSection />
      </main>
      <HomeFooter />
    </HomeLayout>
  );
}
