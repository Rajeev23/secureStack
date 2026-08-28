import Link from "next/link";
import { LogoIcon } from "@/components/feedback/logo";
import { DashboardCta } from "@/components/shared/dashboard-cta";
import { HOME_CTA, HOME_FOOTER, HOME_NAV } from "@/features/home/data/copy";

export function HomeFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link href="/" aria-label="SecureStack home" className="inline-flex items-center gap-2 font-semibold tracking-tight">
              <LogoIcon className="size-6" />
              <span>SecureStack</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {HOME_FOOTER.blurb}
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-col gap-1 sm:items-end">
              {HOME_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={HOME_CTA.signupHref}
                  className="flex min-h-11 items-center text-sm font-medium text-foreground"
                >
                  {HOME_CTA.primary}
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign in
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{HOME_FOOTER.copyright}</p>
          <DashboardCta size="sm" label={HOME_CTA.primary} className="w-full sm:w-auto" />
        </div>
      </div>
      <p
        aria-hidden
        className="select-none overflow-hidden whitespace-nowrap pt-6 text-center text-[clamp(2.75rem,14vw,8rem)] leading-none font-medium tracking-tight text-foreground/10 sm:pt-10"
      >
        SecureStack
      </p>
    </footer>
  );
}
