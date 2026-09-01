"use client";

import { useSyncExternalStore } from "react";
import { useScanSessionStore } from "@/features/scan-session/stores/scan-session-store";

function subscribeHydration(onChange: () => void) {
  return useScanSessionStore.persist.onFinishHydration(onChange);
}

export function useHydratedScanSession() {
  const scan = useScanSessionStore((state) => state.scan);
  const clearScan = useScanSessionStore((state) => state.clearScan);
  // Server and the hydration pass must both see `false`. Reading hasHydrated()
  // during useState init mismatches after a client navigation (store already live).
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => useScanSessionStore.persist.hasHydrated(),
    () => false,
  );

  return { scan, clearScan, hydrated, isLoading: !hydrated };
}
