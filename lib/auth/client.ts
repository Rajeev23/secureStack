"use client";

import { APP_HOME_PATH } from "@/lib/auth/constants";

export async function signOut(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    const { useUserStore } = await import("@/features/auth/stores/user-store");
    useUserStore.getState().clearUser();
    window.location.assign(APP_HOME_PATH);
  }
}

export async function signIn(email: string, password: string): Promise<Response> {
  return fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<Response> {
  return fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function requestPasswordReset(email: string): Promise<Response> {
  return fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(password: string): Promise<Response> {
  return fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}
