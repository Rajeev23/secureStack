"use client";

import { Fragment, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useIsClient } from "@/hooks/use-is-client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsNotFoundPage } from "@/components/feedback/not-found-context";
import { getBreadcrumbsFromPath } from "@/lib/breadcrumbs";
import { useCompanyContextStore } from "@/stores/company-context-store";
import { useProjectNameMap } from "@/features/projects/hooks/use-projects";
import { cn } from "@/lib/utils";

type CrumbItem = { label: string; href?: string };
type VisibleItem = CrumbItem | { ellipsis: true };

type BreadcrumbsProps = {
  className?: string;
};

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname() ?? "/";
  const company = useCompanyContextStore((state) => state.company);
  const projectNames = useProjectNameMap();
  const isNotFound = useIsNotFoundPage();
  const isMobile = useIsMobile();
  const mounted = useIsClient();

  const items = useMemo<CrumbItem[]>(() => {
    const routeItems = isNotFound ? [{ label: "404" }] : getBreadcrumbsFromPath(pathname, { projectNames });

    const hierarchy: CrumbItem[] = [];
    if (company) {
      hierarchy.push({ label: company.name, href: "/settings/company" });
    }

    const knownLabels = new Set(hierarchy.map((item) => item.label.toLowerCase()));
    const trail = routeItems.filter((item) => !knownLabels.has(item.label.toLowerCase()));

    if (hierarchy.length === 0 && trail.length === 0) {
      return [{ label: "Dashboard", href: "/dashboard" }];
    }

    return [...hierarchy, ...trail];
  }, [company, isNotFound, pathname, projectNames]);

  const visibleItems = useMemo<VisibleItem[]>(() => {
    if (mounted && isMobile && items.length > 2) {
      return [{ ellipsis: true }, ...items.slice(-2)];
    }
    return items;
  }, [mounted, isMobile, items]);

  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList className="md:flex-nowrap">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const key = "ellipsis" in item ? `ellipsis-${index}` : `${item.label}-${index}`;

          return (
            <Fragment key={key}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {"ellipsis" in item ? (
                  <BreadcrumbEllipsis />
                ) : !isLast && item.href ? (
                  <BreadcrumbLink
                    render={
                      <Link href={item.href} className="max-w-32 truncate sm:max-w-none">
                        {item.label}
                      </Link>
                    }
                  />
                ) : isLast ? (
                  <BreadcrumbPage className="max-w-32 truncate sm:max-w-none">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <span className="max-w-32 truncate sm:max-w-none">{item.label}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
