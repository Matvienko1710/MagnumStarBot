"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAuth } from "@/lib/hooks/useAuth"

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  user: any | null
  loading: boolean
  error: string | null
  login: () => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
