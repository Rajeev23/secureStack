"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/features/auth/stores/user-store";

/** Bounce already-signed-in users without blocking the form from rendering. */
export function useRedirectIfSignedIn(fallbackPath = "/dashboard") {
  const router = useRouter();
  const status = useUserStore((state) => state.status);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(fallbackPath);
    }
  }, [fallbackPath, router, status, user]);
}
