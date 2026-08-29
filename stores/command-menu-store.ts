"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PERSIST_VERSION, persistMigrate } from "@/lib/zustand/persist";

type CommandMenuState = {
  isOpen: boolean;
  recentPages: { title: string; href: string }[];
  favorites: string[];
  setOpen: (open: boolean) => void;
  toggle: () => void;
  addRecentPage: (page: { title: string; href: string }) => void;
  toggleFavorite: (href: string) => void;
};

export const useCommandMenuStore = create<CommandMenuState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      recentPages: [],
      favorites: [],
      setOpen: (open) => set({ isOpen: open }),
      toggle: () => set({ isOpen: !get().isOpen }),
      addRecentPage: (page) =>
        set((state) => {
          const current = state.recentPages[0];
          if (current?.href === page.href && current.title === page.title) {
            return state;
          }
          const filtered = state.recentPages.filter((item) => item.href !== page.href);
          return { recentPages: [page, ...filtered].slice(0, 8) };
        }),
      toggleFavorite: (href) =>
        set((state) => ({
          favorites: state.favorites.includes(href)
            ? state.favorites.filter((f) => f !== href)
            : [...state.favorites, href],
        })),
    }),
    {
      name: "dashboard-command-menu",
      version: PERSIST_VERSION,
      migrate: persistMigrate<Pick<CommandMenuState, "recentPages" | "favorites">>,
      partialize: (state) => ({
        recentPages: state.recentPages,
        favorites: state.favorites,
      }),
      skipHydration: true,
    },
  ),
);
