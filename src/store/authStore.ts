import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PremiumPlan } from "@/types/premium";
import { signOutFirebaseAuth } from "@/services/firebaseAuthBridge";

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
        // Sign out of Firebase Auth so Firestore sees request.auth == null again
        signOutFirebaseAuth().catch((err) =>
          console.warn("[authStore] Firebase sign-out failed:", err),
        );
        set({ email: null, isAuthenticated: false, user: null, selectedPlan: null });
      },
    }),
    { name: "aerlot-auth" },
  ),
);

