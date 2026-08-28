"use client";

import { useEffect } from "react";
import { useUserStore } from "@/features/auth/stores/user-store";

/**
 * Hydrates the client user store from the Supabase session
 * so refresh / deep links show the correct identity.
 * Does not block Sign in / Sign up while Auth is slow.
 */
export function UserSessionHydrator() {
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    const controller = new AbortController();

    async function hydrate() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => ({}))) as {
          user?: {
            id: string;
            name: string;
            email: string;
            role: string;
            avatar?: string;
          } | null;
        };

        if (controller.signal.aborted) return;

        if (response.ok && data.user) {
          setUser(data.user);
        } else {
          clearUser();
        }
      } catch {
        if (!controller.signal.aborted) clearUser();
      }
    }

    void hydrate();
    return () => controller.abort();
  }, [setUser, clearUser]);

  return null;
}
