"use client";

import { create } from "zustand";
import type { CompanyPublic } from "@/server/supabase/types";

type CompanyContextState = {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  company: CompanyPublic | null;
  onboardingStep: "company" | "complete" | null;
  hydrateFromApi: () => Promise<void>;
  applyContext: (payload: {
    company: CompanyPublic | null;
    onboardingStep: "company" | "complete" | null;
  }) => void;
};

export const useCompanyContextStore = create<CompanyContextState>()((set) => ({
  status: "idle",
  error: null,
  company: null,
  onboardingStep: null,
  applyContext: (payload) => {
    set({
      status: "ready",
      error: null,
      company: payload.company,
      onboardingStep: payload.onboardingStep,
    });
  },
  hydrateFromApi: async () => {
    set({ status: "loading", error: null });
    try {
      const response = await fetch("/api/company/context", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to load company.");
      }
      const data = (await response.json()) as {
        company: CompanyPublic | null;
        onboardingStep: "company" | "complete" | null;
      };
      set({
        status: "ready",
        error: null,
        company: data.company,
        onboardingStep: data.onboardingStep,
      });
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : "Unable to load company.",
      });
    }
  },
}));
