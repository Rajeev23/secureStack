"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PERSIST_VERSION, persistMigrate } from "@/lib/zustand/persist";

export type ContentLayout = "full" | "contained";

type LayoutState = {
  contentLayout: ContentLayout;
  setContentLayout: (layout: ContentLayout) => void;
  toggleContentLayout: () => void;
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      contentLayout: "full",
      setContentLayout: (layout) => set({ contentLayout: layout }),
      toggleContentLayout: () =>
        set({
          contentLayout: get().contentLayout === "full" ? "contained" : "full",
        }),
    }),
    {
      name: "dashboard-layout",
      version: PERSIST_VERSION,
      migrate: persistMigrate<Pick<LayoutState, "contentLayout">>,
      skipHydration: true,
    },
  ),
);
