import { create } from "zustand";
import { DEMO_USER } from "@/lib/auth/constants";
import type { User } from "@/features/auth/types/user";

type UserState = {
  user: User | null;
  status: "loading" | "authenticated" | "anonymous";
  setUser: (user: User) => void;
  clearUser: () => void;
  setStatus: (status: UserState["status"]) => void;
};

const demoUser: User = {
  id: DEMO_USER.id,
  name: DEMO_USER.name,
  email: DEMO_USER.email,
  role: DEMO_USER.role,
};

export const useUserStore = create<UserState>()((set) => ({
  user: null,
  status: "anonymous",
  setUser: (user) => set({ user, status: "authenticated" }),
  clearUser: () => set({ user: null, status: "anonymous" }),
  setStatus: (status) => set({ status }),
}));

/** Fallback display user while session hydrates (demo shell). */
export function getDisplayUser(user: User | null): User {
  return user ?? demoUser;
}
