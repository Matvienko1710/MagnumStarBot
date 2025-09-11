"use client"

import { useState, useCallback } from "react"
import { useAuth } from "./useAuth"

export function useGameAPI() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)

  const makeRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!token) {
        throw new Error("Not authenticated")
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Request failed")
      }

      return response.json()
    },
    [token],
  )

  const click = useCallback(
    async (clickPower = 1, energyCost = 1) => {
      setLoading(true)
      try {
        const result = await makeRequest("/api/game/click", {
          method: "POST",
          body: JSON.stringify({ clickPower, energyCost }),
        })
        return result
      } finally {
        setLoading(false)
      }
    },
    [makeRequest],
  )

  const openCase = useCallback(
    async (caseId: string) => {
      setLoading(true)
      try {
        const result = await makeRequest("/api/game/case/open", {
          method: "POST",
          body: JSON.stringify({ caseId }),
        })
        return result
      } finally {
        setLoading(false)
      }
    },
    [makeRequest],
  )

  const getStats = useCallback(async () => {
    setLoading(true)
    try {
      const result = await makeRequest("/api/game/stats")
      return result
    } finally {
      setLoading(false)
    }
  }, [makeRequest])

  const updateStats = useCallback(
    async (gameData: any) => {
      setLoading(true)
      try {
        const result = await makeRequest("/api/game/stats", {
          method: "POST",
          body: JSON.stringify({ gameData }),
        })
        return result
      } finally {
        setLoading(false)
      }
    },
    [makeRequest],
  )

  const getLeaderboard = useCallback(
    async (type: "coins" | "level" | "clicks" = "coins", limit = 100) => {
      setLoading(true)
      try {
        const result = await makeRequest(`/api/leaderboard?type=${type}&limit=${limit}`)
        return result
      } finally {
        setLoading(false)
      }
    },
    [makeRequest],
  )

  return {
    loading,
    click,
    openCase,
    getStats,
    updateStats,
    getLeaderboard,
  }
}
