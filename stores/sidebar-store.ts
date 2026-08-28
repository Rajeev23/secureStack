"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PERSIST_VERSION, persistMigrate } from "@/lib/zustand/persist";

type SidebarState = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isOpen: true,
      setOpen: (open) => set({ isOpen: open }),
      toggle: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: "dashboard-sidebar",
      version: PERSIST_VERSION,
      migrate: persistMigrate<Pick<SidebarState, "isOpen">>,
      partialize: (state) => ({
        isOpen: state.isOpen,
      }),
      skipHydration: true,
    },
  ),
);
