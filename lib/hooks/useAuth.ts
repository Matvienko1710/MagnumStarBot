"use client"

import { useState, useEffect, useCallback } from "react"
import { getTelegramWebApp } from "../auth/telegramAuth"

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  user: any | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
    loading: true,
    error: null,
  })

  const login = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))

      const webApp = getTelegramWebApp()
      if (!webApp) {
        // Для разработки используем моковые данные
        const mockUser = {
          id: Math.floor(Math.random() * 1000000),
          first_name: "Test User",
          username: "testuser",
          language_code: "ru",
        }

        const response = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user: mockUser }),
        })

        const data = await response.json()

        if (data.success) {
          localStorage.setItem("auth_token", data.token)
          setAuthState({
            isAuthenticated: true,
            token: data.token,
            user: data.user,
            loading: false,
            error: null,
          })
        } else {
          throw new Error(data.error || "Authentication failed")
        }
        return
      }

      // Реальная аутентификация через Telegram WebApp
      const initData = webApp.initData
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ initData }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("auth_token", data.token)
        setAuthState({
          isAuthenticated: true,
          token: data.token,
          user: data.user,
          loading: false,
          error: null,
        })
      } else {
        throw new Error(data.error || "Authentication failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      }))
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
    setAuthState({
      isAuthenticated: false,
      token: null,
      user: null,
      loading: false,
      error: null,
    })
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setAuthState((prev) => ({ ...prev, loading: false }))
        return
      }

      // Проверяем валидность токена
      const response = await fetch("/api/game/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAuthState({
          isAuthenticated: true,
          token,
          user: data.stats?.user || null,
          loading: false,
          error: null,
        })
      } else {
        localStorage.removeItem("auth_token")
        setAuthState((prev) => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error("Auth check error:", error)
      localStorage.removeItem("auth_token")
      setAuthState((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    ...authState,
    login,
    logout,
    checkAuth,
  }
}
