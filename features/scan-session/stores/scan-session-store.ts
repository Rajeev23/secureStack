"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SessionScanResult } from "@/services/session-scan/types";

type ScanSessionState = {
  scan: SessionScanResult | null;
  setScan: (scan: SessionScanResult) => void;
  clearScan: () => void;
};

const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useScanSessionStore = create<ScanSessionState>()(
  persist(
    (set) => ({
      scan: null,
      setScan: (scan) => set({ scan }),
      clearScan: () => set({ scan: null }),
    }),
    {
      name: "securestack-session-scan",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? memoryStorage : sessionStorage,
      ),
      partialize: (state) => ({ scan: state.scan }),
      skipHydration: true,
    },
  ),
);
