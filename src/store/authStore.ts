import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PremiumPlan } from "@/types/premium";

interface AuthState {
  email: string | null;
  isAuthenticated: boolean;
  user: {
    uid?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    imageUrl?: string;
  } | null;
  selectedPlan: PremiumPlan | null;
  setEmail: (email: string) => void;
  setUser: (user: AuthState["user"]) => void;
  setAuthenticated: (v: boolean) => void;
  setSelectedPlan: (p: PremiumPlan | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: null,
      isAuthenticated: false,
      user: null,
      selectedPlan: null,
      setEmail: (email) => set({ email }),
      setUser: (user) => set({ user }),
      setAuthenticated: (v) => set({ isAuthenticated: v }),
      setSelectedPlan: (p) => set({ selectedPlan: p }),
      logout: () => {
        localStorage.removeItem("@userSession");
        set({ email: null, isAuthenticated: false, user: null, selectedPlan: null });
      },
    }),
    { name: "aerlot-auth" },
  ),
);
