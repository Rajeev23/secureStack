"use client";

import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeKeyboardShortcuts } from "@/components/layout/theme-keyboard-shortcuts";
import { UserSessionHydrator } from "@/features/auth";
import { getQueryClient } from "@/lib/tanstack/query-client";
import { rehydratePersistedStores } from "@/lib/zustand/rehydrate";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  useEffect(() => {
    void rehydratePersistedStores();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <UserSessionHydrator />
        <ThemeKeyboardShortcuts />
        <TooltipProvider delay={200}>
          <Toaster position="top-right" />
          {children}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
