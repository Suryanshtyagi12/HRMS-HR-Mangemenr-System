import { create } from "zustand"
import { AuthUser } from "@/lib/auth-client"

interface AuthState {
  user: AuthUser | null
  isHydrated: boolean
  setUser: (user: AuthUser | null) => void
  clearUser: () => void
  setHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrated: false,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setHydrated: (value) => set({ isHydrated: value }),
}))
