import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { HOME_CTA } from "@/features/home/data/copy";
import { cn } from "@/lib/utils";

type DashboardCtaProps = {
  label?: string;
  className?: string;
  size?: "sm" | "lg" | "pill";
};

export function DashboardCta({
  label = HOME_CTA.primary,
  className,
  size = "pill",
}: DashboardCtaProps) {
  return (
    <Link href={HOME_CTA.signupHref} className={cn(buttonVariants({ size }), className)}>
      {label}
    </Link>
  );
}
