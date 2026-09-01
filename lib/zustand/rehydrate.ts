import { useScanSessionStore } from "@/features/scan-session/stores/scan-session-store";
import { useCommandMenuStore } from "@/stores/command-menu-store";
import { useLayoutStore } from "@/stores/layout-store";
import { useSidebarStore } from "@/stores/sidebar-store";

const persistedStores = [
  useSidebarStore,
  useLayoutStore,
  useCommandMenuStore,
  useScanSessionStore,
] as const;

/** Rehydrate persisted Zustand stores after mount to avoid SSR/client mismatches. */
export function rehydratePersistedStores() {
  return Promise.all(persistedStores.map((store) => store.persist.rehydrate()));
}
