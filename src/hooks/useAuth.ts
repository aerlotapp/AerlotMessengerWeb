import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const { email, isAuthenticated, logout } = useAuthStore();
  return { email, isAuthenticated, logout };
}
