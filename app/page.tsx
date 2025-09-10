"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Coins,
  Star,
  Home,
  Package,
  Calendar,
  Wallet,
  Zap,
  User,
  Gift,
  Trophy,
  Sparkles,
  Target,
  Clock,
  TrendingUp,
} from "lucide-react"

interface GameState {
  magnumCoins: number
  stars: number
  energy: number
  maxEnergy: number
  clickAnimating: boolean
  energyAnimating: boolean
  rewardPopups: Array<{ id: number; x: number; y: number }>
  totalClicks: number
  lastEnergyRestore: number
}

interface CaseItem {
  id: string
  name: string
  price: number
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic"
  rewards: Array<{ type: "coins" | "stars" | "energy"; min: number; max: number }>
  image: string
  glowColor: string
}

export default function TelegramClickerApp() {
  const [gameState, setGameState] = useState<GameState>({
    magnumCoins: 0,
    stars: 0,
    energy: 100,
    maxEnergy: 100,
    clickAnimating: false,
    energyAnimating: false,
    rewardPopups: [],
    totalClicks: 0,
    lastEnergyRestore: Date.now(),
  })

  const [activeTab, setActiveTab] = useState("home")
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null)
  const [openingCase, setOpeningCase] = useState(false)
  const [caseResult, setCaseResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [telegramId, setTelegramId] = useState<number | null>(null)
  const [isClicking, setIsClicking] = useState(false)
  const [clickTimes, setClickTimes] = useState<number[]>([])
  const [clickCooldown, setClickCooldown] = useState(0)

  // Initialize app and load user data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get Telegram WebApp data
        let tgId: number | null = null
        
        console.log('=== TELEGRAM WEBAPP DEBUG ===')
        console.log('window.Telegram exists:', typeof window !== 'undefined' && !!window.Telegram)
        console.log('window.Telegram.WebApp exists:', typeof window !== 'undefined' && !!window.Telegram?.WebApp)
        
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp
          console.log('Telegram WebApp object:', tg)
          console.log('initDataUnsafe:', tg.initDataUnsafe)
          console.log('initData:', tg.initData)
          
          tg.ready()
          tg.expand()
          
          const userData = tg.initDataUnsafe?.user
          console.log('Telegram user data:', userData)
          
          if (userData && userData.id) {
            tgId = userData.id
            console.log('✅ Using Telegram ID from user data:', tgId)
          } else {
            console.log('❌ No user data or ID found in initDataUnsafe')
            
            // Try to parse initData manually
            try {
              const initData = tg.initData
              console.log('Raw initData:', initData)
              
              if (initData) {
                const urlParams = new URLSearchParams(initData)
                const userParam = urlParams.get('user')
                console.log('User param from initData:', userParam)
                
                if (userParam) {
                  const userObj = JSON.parse(decodeURIComponent(userParam))
                  console.log('Parsed user object:', userObj)
                  
                  if (userObj.id) {
                    tgId = userObj.id
                    console.log('✅ Using Telegram ID from parsed initData:', tgId)
                  }
                }
              }
            } catch (error) {
              console.error('Error parsing initData:', error)
            }
          }
        }
        
        // Fallback for development/testing
        if (!tgId) {
          // Try to get from localStorage first
          const savedId = localStorage.getItem('telegram-user-id')
          if (savedId) {
            tgId = parseInt(savedId)
            console.log('✅ Using saved Telegram ID from localStorage:', tgId)
          } else {
            // Only create fallback ID if we're not in Telegram WebApp
            const isInTelegram = typeof window !== 'undefined' && window.Telegram?.WebApp
            if (!isInTelegram) {
              tgId = Math.floor(Math.random() * 1000000000) + 100000000 // Random 9-digit number
              localStorage.setItem('telegram-user-id', tgId.toString())
              console.log('⚠️ Using fallback ID for non-Telegram environment:', tgId)
            } else {
              console.log('❌ No Telegram ID available and we are in Telegram WebApp - this should not happen')
              // Don't create a user if we can't get Telegram ID in Telegram WebApp
              setLoading(false)
              return
            }
          }
        } else {
          // Save the ID to localStorage for consistency
          localStorage.setItem('telegram-user-id', tgId.toString())
          console.log('💾 Saved Telegram ID to localStorage:', tgId)
        }
        
        // Validate Telegram ID
        if (!tgId || tgId < 100000000 || tgId > 999999999) {
          console.error('❌ Invalid Telegram ID:', tgId, '- must be a 9-digit number')
          setLoading(false)
          return
        }
        
        console.log('=== FINAL TELEGRAM ID:', tgId, '===')
        
        setTelegramId(tgId)
        
        // Try to load from API first
        try {
          console.log('🔍 Fetching user data from API...')
          const response = await fetch(`/api/users?telegramId=${tgId}`)
          const data = await response.json()
          
          console.log('📡 API response:', data)
          
          if (data.success && data.user) {
            console.log('✅ Loaded data from MongoDB:', data.user)
            setGameState({
              magnumCoins: data.user.magnumCoins || 0,
              stars: data.user.stars || 0,
              energy: data.user.energy || 100,
              maxEnergy: data.user.maxEnergy || 100,
              clickAnimating: false,
              energyAnimating: false,
              rewardPopups: [],
              totalClicks: data.user.totalClicks || 0,
              lastEnergyRestore: data.user.lastEnergyRestore ? new Date(data.user.lastEnergyRestore).getTime() : Date.now(),
            })
          } else {
            console.log('❌ No user data from API, creating new user')
            // Create new user in API
            await createNewUser(tgId)
          }
        } catch (error) {
          console.warn('⚠️ API not available, loading from localStorage:', error)
          loadFromLocalStorage()
        }
      } catch (error) {
        console.error('Error initializing app:', error)
        loadFromLocalStorage()
      } finally {
        setLoading(false)
      }
    }

    const createNewUser = async (tgId: number) => {
      try {
        console.log('🆕 Creating new user with ID:', tgId)
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telegramId: tgId,
            username: 'user',
            firstName: 'User',
            lastName: 'User',
          }),
        })
        
        const data = await response.json()
        console.log('📡 Create user API response:', data)
        
        if (data.success && data.user) {
          console.log('✅ Created new user in MongoDB:', data.user)
          setGameState({
            magnumCoins: data.user.magnumCoins || 100,
            stars: data.user.stars || 0,
            energy: data.user.energy || 100,
            maxEnergy: data.user.maxEnergy || 100,
            clickAnimating: false,
            energyAnimating: false,
            rewardPopups: [],
            totalClicks: data.user.totalClicks || 0,
            lastEnergyRestore: data.user.lastEnergyRestore ? new Date(data.user.lastEnergyRestore).getTime() : Date.now(),
          })
        } else {
          console.error('❌ Failed to create user - API returned error:', data)
          throw new Error('Failed to create user')
        }
      } catch (error) {
        console.error('❌ Failed to create user in API:', error)
        loadFromLocalStorage()
      }
    }

    const loadFromLocalStorage = () => {
      try {
        const saved = localStorage.getItem('magnum-clicker-game-state')
        if (saved) {
          const parsed = JSON.parse(saved)
          setGameState(prev => ({
            ...prev,
            ...parsed,
            clickAnimating: false,
            energyAnimating: false,
            rewardPopups: [],
          }))
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error)
      }
    }

    initializeApp()
  }, [])

  // Save to localStorage whenever gameState changes
  useEffect(() => {
    if (!loading) {
      const stateToSave = {
        magnumCoins: gameState.magnumCoins,
        stars: gameState.stars,
        energy: gameState.energy,
        maxEnergy: gameState.maxEnergy,
        totalClicks: gameState.totalClicks,
        lastEnergyRestore: gameState.lastEnergyRestore,
      }
      localStorage.setItem('magnum-clicker-game-state', JSON.stringify(stateToSave))
    }
  }, [gameState.magnumCoins, gameState.stars, gameState.energy, gameState.totalClicks, gameState.lastEnergyRestore, loading])

  // Energy restoration
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        const now = Date.now()
        const timeDiff = now - prev.lastEnergyRestore
        const energyToRestore = Math.floor(timeDiff / 30000) // 1 energy per 30 seconds

        if (energyToRestore > 0 && prev.energy < prev.maxEnergy) {
          return {
            ...prev,
            energy: Math.min(prev.maxEnergy, prev.energy + energyToRestore),
            lastEnergyRestore: now,
          }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Check if user can click (max 3 clicks per second) - optimized
  const canClick = useCallback(() => {
    if (clickTimes.length < 3) return true
    
    const now = Date.now()
    const oneSecondAgo = now - 1000
    let recentCount = 0
    
    // Count from the end (most recent clicks)
    for (let i = clickTimes.length - 1; i >= 0; i--) {
      if (clickTimes[i] > oneSecondAgo) {
        recentCount++
        if (recentCount >= 3) return false
      } else {
        break // No need to check older clicks
      }
    }
    
    return true
  }, [clickTimes])

  // Update click cooldown display (less frequent updates)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const oneSecondAgo = now - 1000
      const recentClicks = clickTimes.filter(time => time > oneSecondAgo)
      const remainingClicks = 3 - recentClicks.length
      setClickCooldown(Math.max(0, remainingClicks))
    }, 200) // Reduced frequency from 100ms to 200ms

    return () => clearInterval(interval)
  }, [clickTimes])

  const cases: CaseItem[] = [
    {
      id: "bronze",
      name: "Бронзовый кейс",
      price: 100,
      rarity: "common",
      rewards: [
        { type: "coins", min: 50, max: 200 },
        { type: "stars", min: 0.001, max: 0.01 },
      ],
      image: "🥉",
      glowColor: "rgba(205, 127, 50, 0.5)",
    },
    {
      id: "silver",
      name: "Серебряный кейс",
      price: 500,
      rarity: "rare",
      rewards: [
        { type: "coins", min: 300, max: 800 },
        { type: "stars", min: 0.01, max: 0.05 },
        { type: "energy", min: 10, max: 30 },
      ],
      image: "🥈",
      glowColor: "rgba(192, 192, 192, 0.5)",
    },
    {
      id: "gold",
      name: "Золотой кейс",
      price: 1000,
      rarity: "epic",
      rewards: [
        { type: "coins", min: 800, max: 2000 },
        { type: "stars", min: 0.05, max: 0.15 },
        { type: "energy", min: 20, max: 50 },
      ],
      image: "🥇",
      glowColor: "rgba(255, 215, 0, 0.5)",
    },
    {
      id: "platinum",
      name: "Платиновый кейс",
      price: 5000,
      rarity: "legendary",
      rewards: [
        { type: "coins", min: 3000, max: 8000 },
        { type: "stars", min: 0.1, max: 0.5 },
        { type: "energy", min: 50, max: 100 },
      ],
      image: "💎",
      glowColor: "rgba(147, 51, 234, 0.5)",
    },
    {
      id: "mythic",
      name: "Мифический кейс",
      price: 15000,
      rarity: "mythic",
      rewards: [
        { type: "coins", min: 10000, max: 25000 },
        { type: "stars", min: 0.5, max: 2.0 },
        { type: "energy", min: 100, max: 200 },
      ],
      image: "👑",
      glowColor: "rgba(255, 20, 147, 0.5)",
    },
  ]

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      if (gameState.energy <= 0 || isClicking || !canClick()) return

      // Prevent multiple rapid clicks
      setIsClicking(true)
      
      // Record click time (optimized)
      const now = Date.now()
      setClickTimes(prev => {
        // Keep only last 10 clicks to prevent memory issues
        const newTimes = [...prev, now]
        return newTimes.length > 10 ? newTimes.slice(-10) : newTimes
      })
      
      // Prevent default touch behavior
      event.preventDefault()

      const rect = event.currentTarget.getBoundingClientRect()
      let x: number, y: number

      // Handle both mouse and touch events
      if ("touches" in event && event.touches.length > 0) {
        x = event.touches[0].clientX - rect.left
        y = event.touches[0].clientY - rect.top
      } else if ("clientX" in event) {
        x = event.clientX - rect.left
        y = event.clientY - rect.top
      } else {
        x = rect.width / 2
        y = rect.height / 2
      }

      // Haptic feedback for mobile devices
      if ("vibrate" in navigator) {
        navigator.vibrate(50)
      }

      // Update local state immediately for responsiveness
      setGameState((prev) => ({
        ...prev,
        magnumCoins: prev.magnumCoins + 1,
        energy: prev.energy - 1,
        clickAnimating: true,
        energyAnimating: true,
        totalClicks: prev.totalClicks + 1,
        rewardPopups: [...prev.rewardPopups, { id: Date.now(), x, y }],
      }))

      // Try to sync with API in background (but don't update state to avoid double counting)
      if (telegramId) {
        try {
          const response = await fetch('/api/click', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ telegramId }),
          })
          
          const data = await response.json()
          if (data.success && data.user) {
            // Only update if there's a significant difference (API error recovery)
            setGameState(prev => {
              const apiCoins = data.user.magnumCoins
              const localCoins = prev.magnumCoins
              const difference = Math.abs(apiCoins - localCoins)
              
              // Only sync if difference is more than 1 (indicating API error)
              if (difference > 1) {
                console.log('Syncing with API due to significant difference:', { apiCoins, localCoins })
                return {
                  ...prev,
                  magnumCoins: data.user.magnumCoins,
                  stars: data.user.stars,
                  energy: data.user.energy,
                  totalClicks: data.user.totalClicks,
                  level: data.user.level,
                }
              }
              return prev
            })
          }
        } catch (error) {
          console.warn('Failed to sync click with API:', error)
        }
      }

      setTimeout(() => {
        setGameState((prev) => ({ ...prev, clickAnimating: false, energyAnimating: false }))
        setIsClicking(false) // Reset clicking state
      }, 300) // Reduced from 800ms to 300ms

      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          rewardPopups: prev.rewardPopups.filter((popup) => popup.id !== Date.now()),
        }))
      }, 1200)
    },
    [gameState.energy, telegramId, isClicking, canClick],
  )

  const openCase = useCallback(
    async (caseItem: CaseItem) => {
      if (gameState.magnumCoins < caseItem.price) return

      setOpeningCase(true)
      setSelectedCase(caseItem)

      // Simulate case opening animation
      setTimeout(async () => {
        const rewards = caseItem.rewards.map((reward) => ({
          type: reward.type,
          amount: Math.random() * (reward.max - reward.min) + reward.min,
        }))

        let newCoins = gameState.magnumCoins - caseItem.price
        let newStars = gameState.stars
        let newEnergy = gameState.energy

        rewards.forEach((reward) => {
          if (reward.type === "coins") newCoins += Math.floor(reward.amount)
          if (reward.type === "stars") newStars += reward.amount
          if (reward.type === "energy") newEnergy = Math.min(gameState.maxEnergy, newEnergy + Math.floor(reward.amount))
        })

        // Update local state
        setGameState((prev) => ({
          ...prev,
          magnumCoins: newCoins,
          stars: newStars,
          energy: newEnergy,
        }))

        // Sync with API if available
        if (telegramId) {
          try {
            // Update user data in API
            await fetch('/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                telegramId,
                magnumCoins: newCoins,
                stars: newStars,
                energy: newEnergy,
                totalClicks: gameState.totalClicks,
              }),
            })
          } catch (error) {
            console.warn('Failed to sync case opening with API:', error)
          }
        }

        setCaseResult(rewards)
        setOpeningCase(false)
      }, 2000)
    },
    [gameState, telegramId],
  )

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M"
    if (num >= 1000) return (num / 1000).toFixed(2) + "K"
    return num.toFixed(num < 1 ? 4 : 0)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-400"
      case "rare":
        return "text-blue-400"
      case "epic":
        return "text-purple-400"
      case "legendary":
        return "text-yellow-400"
      case "mythic":
        return "text-pink-400"
      default:
        return "text-gray-400"
    }
  }

  const renderHomeScreen = () => (
    <div className="flex-1 flex flex-col mobile-safe-area mobile-compact space-y-4 relative touch-optimized no-overscroll">
      {/* Profile Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="mobile-button w-10 h-10 rounded-full bg-card/50 backdrop-blur-md border border-border/50 hover:bg-accent/20 touch-optimized"
        >
          <User className="w-5 h-5 text-foreground" />
        </Button>
      </div>

      {/* Energy Bar */}
      <Card className="card-gradient p-4 hw-accelerated">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Zap className={`w-5 h-5 text-energy ${gameState.energyAnimating ? "energy-drain" : ""}`} />
            <span className="text-sm font-medium text-foreground">Энергия</span>
          </div>
          <span className="text-sm font-bold text-energy">
            {gameState.energy}/{gameState.maxEnergy}
          </span>
        </div>
        <Progress value={(gameState.energy / gameState.maxEnergy) * 100} className="h-2 bg-muted" />
        <p className="text-xs text-muted-foreground mt-1">Восстанавливается: 1 энергия / 30 сек</p>
      </Card>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 mobile-grid-compact">
        <Card className="card-gradient p-4 text-center hw-accelerated">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Coins className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-bold text-foreground">Magnum</h3>
          </div>
          <p className="text-xl font-bold text-accent">{formatNumber(gameState.magnumCoins)}</p>
        </Card>

        <Card className="card-gradient p-4 text-center hw-accelerated">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-bold text-foreground">Stars</h3>
          </div>
          <p className="text-xl font-bold text-yellow-500">{formatNumber(gameState.stars)}</p>
        </Card>
      </div>

      {/* Clicker Button */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <Button
            onClick={handleClick}
            onTouchStart={handleClick}
            disabled={gameState.energy <= 0 || !canClick()}
            className={`magnum-coin w-40 h-40 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mobile-clicker gpu-accelerated ${
              gameState.clickAnimating ? "coin-bounce" : ""
            }`}
            size="lg"
          >
            <div className="flex flex-col items-center space-y-2 relative z-10">
              <div className="text-4xl font-black text-amber-900 drop-shadow-lg">M</div>
              <span className="text-xs font-bold text-amber-900 mobile-text-sm drop-shadow-md">
                {gameState.energy > 0 ? "КЛИК" : "НЕТ ЭНЕРГИИ"}
              </span>
            </div>
          </Button>

          {/* Reward Popups */}
          {gameState.rewardPopups.map((popup) => (
            <div
              key={popup.id}
              className="absolute pointer-events-none reward-popup text-orange-400 font-bold text-base z-10 gpu-accelerated drop-shadow-lg"
              style={{ left: popup.x, top: popup.y }}
            >
              +1 🪙
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <Card className="card-gradient p-4 hw-accelerated">
        <div className="grid grid-cols-3 mobile-grid-compact text-center">
          <div>
            <p className="text-muted-foreground text-xs">Всего кликов</p>
            <p className="text-lg font-bold text-foreground">{formatNumber(gameState.totalClicks)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Сила клика</p>
            <p className="text-lg font-bold text-accent">1.0001</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Уровень</p>
            <p className="text-lg font-bold text-primary">{Math.floor(gameState.totalClicks / 100) + 1}</p>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderCasesScreen = () => (
    <div className="flex-1 mobile-safe-area mobile-compact space-y-4 mobile-scroll no-overscroll">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center space-x-2">
          <Package className="w-6 h-6 text-primary" />
          <span>Магазин кейсов</span>
        </h1>
        <p className="text-sm text-muted-foreground">Откройте кейсы и получите награды!</p>
      </div>

      {/* Balance Display */}
      <Card className="card-gradient p-4 hw-accelerated">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-foreground">Ваш баланс:</span>
          </div>
          <span className="text-lg font-bold text-accent">{formatNumber(gameState.magnumCoins)} MC</span>
        </div>
      </Card>

      {/* Cases Grid */}
      <div className="space-y-3">
        {cases.map((caseItem, index) => (
          <Card
            key={caseItem.id}
            className={`case-card p-4 cursor-pointer transition-all duration-300 hover:scale-105 touch-optimized mobile-button ${
              caseItem.rarity === "legendary" || caseItem.rarity === "mythic" ? "case-glow" : ""
            }`}
            onClick={() => openCase(caseItem)}
          >
            <div className="flex items-center space-x-4">
              {/* Case Image */}
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl border border-border/50">
                {caseItem.image}
              </div>

              {/* Case Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-bold text-foreground">{caseItem.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full bg-muted/20 ${getRarityColor(caseItem.rarity)}`}>
                    {caseItem.rarity.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Возможные награды:</p>
                  <div className="flex flex-wrap gap-1">
                    {caseItem.rewards.map((reward, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">
                        {reward.type === "coins" && "🪙"}
                        {reward.type === "stars" && "⭐"}
                        {reward.type === "energy" && "⚡"}
                        {reward.min}-{reward.max}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price and Button */}
              <div className="text-right space-y-2">
                <div className="text-lg font-bold text-accent">{caseItem.price} MC</div>
                <Button
                  size="sm"
                  disabled={gameState.magnumCoins < caseItem.price}
                  className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary"
                >
                  {gameState.magnumCoins >= caseItem.price ? "Открыть" : "Недостаточно"}
                </Button>
              </div>
            </div>

            {/* Rarity Indicator */}
            <div
              className="mt-3 h-1 rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-30"
              style={{ color: caseItem.glowColor.replace("0.5", "1") }}
            />
          </Card>
        ))}
      </div>

      {/* Case Opening Modal */}
      {openingCase && selectedCase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="card-gradient p-8 text-center space-y-6 max-w-sm mx-4">
            <div className="text-6xl animate-spin">{selectedCase.image}</div>
            <h2 className="text-xl font-bold text-foreground">Открываем {selectedCase.name}...</h2>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full animate-pulse"
                style={{ width: "100%" }}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Case Result Modal */}
      {caseResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="card-gradient p-8 text-center space-y-6 max-w-sm mx-4">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-bold text-foreground">Поздравляем!</h2>
            <div className="space-y-2">
              {caseResult.map((reward: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-accent/10">
                  <span className="text-foreground">
                    {reward.type === "coins" && "🪙 Монеты"}
                    {reward.type === "stars" && "⭐ Звезды"}
                    {reward.type === "energy" && "⚡ Энергия"}
                  </span>
                  <span className="font-bold text-accent">+{formatNumber(reward.amount)}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => setCaseResult(null)} className="w-full">
              Забрать награды
            </Button>
          </Card>
        </div>
      )}

      {/* Daily Cases Section */}
      <Card className="card-gradient p-4 hw-accelerated">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center space-x-2">
            <Gift className="w-5 h-5 text-primary" />
            <span>Ежедневные кейсы</span>
          </h3>
          <span className="text-xs text-muted-foreground">Обновление через 12:34:56</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { name: "Утренний", claimed: true, reward: "50 MC" },
            { name: "Дневной", claimed: false, reward: "100 MC" },
            { name: "Вечерний", claimed: false, reward: "200 MC" },
          ].map((daily, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-center ${
                daily.claimed
                  ? "bg-muted/20 border-muted text-muted-foreground"
                  : "bg-accent/10 border-accent/30 text-accent cursor-pointer hover:bg-accent/20"
              }`}
            >
              <div className="text-2xl mb-1">{daily.claimed ? "✅" : "🎁"}</div>
              <div className="text-xs font-medium">{daily.name}</div>
              <div className="text-xs">{daily.reward}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Special Offers */}
      <Card className="card-gradient p-4 hw-accelerated">
        <h3 className="font-bold text-foreground mb-4 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span>Специальные предложения</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <div>
              <div className="font-medium text-foreground">Мега пакет</div>
              <div className="text-xs text-muted-foreground">5 кейсов + бонус энергии</div>
            </div>
            <div className="text-right">
              <div className="text-sm line-through text-muted-foreground">5000 MC</div>
              <div className="font-bold text-yellow-400">3500 MC</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div>
              <div className="font-medium text-foreground">Стартовый набор</div>
              <div className="text-xs text-muted-foreground">3 кейса для новичков</div>
            </div>
            <div className="text-right">
              <div className="text-sm line-through text-muted-foreground">1500 MC</div>
              <div className="font-bold text-purple-400">999 MC</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <Card className="card-gradient p-4 hw-accelerated">
        <h3 className="font-bold text-foreground mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          <span>Статистика кейсов</span>
        </h3>

        <div className="grid grid-cols-2 mobile-grid-compact text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">0</div>
            <div className="text-xs text-muted-foreground">Открыто кейсов</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent">0</div>
            <div className="text-xs text-muted-foreground">Лучшая награда</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">0%</div>
            <div className="text-xs text-muted-foreground">Шанс легендарки</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-xs text-muted-foreground">Потрачено MC</div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderEventsScreen = () => (
    <div className="flex-1 flex items-center justify-center mobile-safe-area mobile-compact coming-soon-bg">
      <Card className="coming-soon-card p-8 text-center space-y-6 max-w-md mx-auto coming-soon-float hw-accelerated">
        <div className="text-6xl mb-4">🎯</div>
        <h1 className="text-3xl font-bold text-foreground">События</h1>
        <p className="text-muted-foreground">Захватывающие события и турниры уже скоро! Следите за обновлениями.</p>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div className="text-left">
              <div className="font-medium text-foreground">Турниры кликеров</div>
              <div className="text-xs text-muted-foreground">Соревнуйтесь с другими игроками</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10">
            <Target className="w-6 h-6 text-primary" />
            <div className="text-left">
              <div className="font-medium text-foreground">Ежедневные задания</div>
              <div className="text-xs text-muted-foreground">Выполняйте задания за награды</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-500/10">
            <Clock className="w-6 h-6 text-purple-400" />
            <div className="text-left">
              <div className="font-medium text-foreground">Временные события</div>
              <div className="text-xs text-muted-foreground">Особые бонусы и награды</div>
            </div>
          </div>
        </div>

        <Button className="w-full bg-gradient-to-r from-primary to-accent">Уведомить о запуске</Button>
      </Card>
    </div>
  )

  const renderWalletScreen = () => (
    <div className="flex-1 flex items-center justify-center mobile-safe-area mobile-compact coming-soon-bg">
      <Card className="coming-soon-card p-8 text-center space-y-6 max-w-md mx-auto coming-soon-float hw-accelerated">
        <div className="text-6xl mb-4">💳</div>
        <h1 className="text-3xl font-bold text-foreground">Кошелек</h1>
        <p className="text-muted-foreground">Система вывода средств и обмена валют находится в разработке.</p>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10">
            <Coins className="w-6 h-6 text-accent" />
            <div className="text-left">
              <div className="font-medium text-foreground">Обмен валют</div>
              <div className="text-xs text-muted-foreground">MC ↔ Stars ↔ TON</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10">
            <TrendingUp className="w-6 h-6 text-primary" />
            <div className="text-left">
              <div className="font-medium text-foreground">Вывод средств</div>
              <div className="text-xs text-muted-foreground">На внешние кошельки</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-500/10">
            <Star className="w-6 h-6 text-yellow-400" />
            <div className="text-left">
              <div className="font-medium text-foreground">Стейкинг</div>
              <div className="text-xs text-muted-foreground">Заморозьте токены за проценты</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/10 border border-border/50">
          <div className="text-sm text-muted-foreground mb-2">Текущий баланс:</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-foreground">Magnum Coins:</span>
              <span className="font-bold text-accent">{formatNumber(gameState.magnumCoins)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Stars:</span>
              <span className="font-bold text-yellow-500">{formatNumber(gameState.stars)}</span>
            </div>
          </div>
        </div>

        <Button className="w-full bg-gradient-to-r from-primary to-accent">Уведомить о запуске</Button>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return renderHomeScreen()
      case "cases":
        return renderCasesScreen()
      case "events":
        return renderEventsScreen()
      case "wallet":
        return renderWalletScreen()
      default:
        return renderHomeScreen()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-foreground">Загрузка игры...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col relative touch-optimized no-overscroll">
      {/* Main Content */}
      <div className="flex-1 mobile-scroll">{renderContent()}</div>

      {/* Bottom Navigation */}
      <nav className="border-t border-border bg-card/50 backdrop-blur-md mobile-nav">
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: "home", icon: Home, label: "Главная" },
            { id: "cases", icon: Package, label: "Кейсы" },
            { id: "events", icon: Calendar, label: "События" },
            { id: "wallet", icon: Wallet, label: "Кошелек" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`flex flex-col items-center space-y-1 p-3 h-auto transition-all duration-200 mobile-button touch-optimized ${
                activeTab === tab.id
                  ? "text-accent bg-accent/10 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  )
}
