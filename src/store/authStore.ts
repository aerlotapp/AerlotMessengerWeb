import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PremiumPlan } from "@/types/premium";

interface AuthState {
  email: string | null;
  isAuthenticated: boolean;
  selectedPlan: PremiumPlan | null;
  setEmail: (email: string) => void;
  setAuthenticated: (v: boolean) => void;
  setSelectedPlan: (p: PremiumPlan | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: null,
      isAuthenticated: false,
      selectedPlan: null,
      setEmail: (email) => set({ email }),
      setAuthenticated: (v) => set({ isAuthenticated: v }),
      setSelectedPlan: (p) => set({ selectedPlan: p }),
      logout: () => set({ email: null, isAuthenticated: false, selectedPlan: null }),
    }),
    { name: "aerlot-auth" },
  ),
);
