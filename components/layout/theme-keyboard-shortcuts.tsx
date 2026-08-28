"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useIsClient } from "@/hooks/use-is-client";

export function ThemeKeyboardShortcuts() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useIsClient();

  React.useEffect(() => {
    if (!mounted) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "d" && e.key !== "D") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      ) {
        return;
      }

      e.preventDefault();
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mounted, resolvedTheme, setTheme]);

  return null;
}
