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
  X,
  Settings,
  Award,
  BarChart3,
  ArrowUp,
} from "lucide-react"

interface GameState {
  magnumCoins: number
  stars: number
  energy: number
  maxEnergy: number
  clickAnimating: boolean
  energyAnimating: boolean
  totalClicks: number
  lastEnergyRestore: number
  clickPower: number
  level: number
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

interface Upgrade {
  id: string
  name: string
  description: string
  price: number
  level: number
  maxLevel: number
  effect: string
  icon: string
}

export default function TelegramClickerApp() {
  const [gameState, setGameState] = useState<GameState>({
    magnumCoins: 0,
    stars: 0,
    energy: 100,
    maxEnergy: 100,
    clickAnimating: false,
    energyAnimating: false,
    totalClicks: 0,
    lastEnergyRestore: Date.now(),
    clickPower: 1,
    level: 1,
  })

  const [activeTab, setActiveTab] = useState("home")
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null)
  const [openingCase, setOpeningCase] = useState(false)
  const [caseResult, setCaseResult] = useState<any>(null)
  const [caseOpeningProgress, setCaseOpeningProgress] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  const [showUpgrades, setShowUpgrades] = useState(false)
  const [loading, setLoading] = useState(true)
  const [telegramId, setTelegramId] = useState<number | null>(null)
  const [isClicking, setIsClicking] = useState(false)
  const [clickTimes, setClickTimes] = useState<number[]>([])
  const [clickCooldown, setClickCooldown] = useState(0)

  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: "click_power",
      name: "Сила клика",
      description: "Увеличивает количество монет за клик",
      price: 100,
      level: 0,
      maxLevel: 50,
      effect: "+1 монета за клик",
      icon: "💪",
    },
    {
      id: "energy_capacity",
      name: "Емкость энергии",
      description: "Увеличивает максимальную энергию",
      price: 200,
      level: 0,
      maxLevel: 25,
      effect: "+10 максимальной энергии",
      icon: "🔋",
    },
    {
      id: "energy_regen",
      name: "Восстановление энергии",
      description: "Ускоряет восстановление энергии",
      price: 500,
      level: 0,
      maxLevel: 20,
      effect: "Восстановление каждые 25 сек",
      icon: "⚡",
    },
    {
      id: "star_multiplier",
      name: "Множитель звезд",
      description: "Увеличивает получение звезд за клик",
      price: 1000,
      level: 0,
      maxLevel: 15,
      effect: "+0.0001 звезды за клик",
      icon: "⭐",
    },
  ])

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
              totalClicks: data.user.totalClicks || 0,
              lastEnergyRestore: data.user.lastEnergyRestore ? new Date(data.user.lastEnergyRestore).getTime() : Date.now(),
              clickPower: data.user.clickPower || 1,
              level: data.user.level || 1,
            })
            
            // Load upgrades from API and apply effects
            if (data.user.upgrades) {
              setUpgrades(prev => prev.map(upgrade => {
                const savedUpgrade = data.user.upgrades.find((u: any) => u.id === upgrade.id)
                if (savedUpgrade) {
                  // Update price based on level
                  const newPrice = Math.floor(upgrade.price * Math.pow(1.5, savedUpgrade.level))
                  return { ...upgrade, level: savedUpgrade.level, price: newPrice }
                }
                return upgrade
              }))
            }
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
            totalClicks: data.user.totalClicks || 0,
            lastEnergyRestore: data.user.lastEnergyRestore ? new Date(data.user.lastEnergyRestore).getTime() : Date.now(),
            clickPower: data.user.clickPower || 1,
            level: data.user.level || 1,
          })
          
          // Load upgrades from API
          if (data.user.upgrades) {
            setUpgrades(prev => prev.map(upgrade => {
              const savedUpgrade = data.user.upgrades.find((u: any) => u.id === upgrade.id)
              if (savedUpgrade) {
                const newPrice = Math.floor(upgrade.price * Math.pow(1.5, savedUpgrade.level))
                return { ...upgrade, level: savedUpgrade.level, price: newPrice }
              }
              return upgrade
            }))
          }
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
          }))
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error)
      }
    }

    initializeApp()
  }, [])

  // Save game state to localStorage
  useEffect(() => {
    if (!loading) {
      const stateToSave = {
        magnumCoins: gameState.magnumCoins,
        stars: gameState.stars,
        energy: gameState.energy,
        maxEnergy: gameState.maxEnergy,
        totalClicks: gameState.totalClicks,
        lastEnergyRestore: gameState.lastEnergyRestore,
        clickPower: gameState.clickPower,
        level: gameState.level,
      }
      localStorage.setItem('magnum-clicker-game-state', JSON.stringify(stateToSave))
    }
  }, [gameState.magnumCoins, gameState.stars, gameState.energy, gameState.totalClicks, gameState.lastEnergyRestore, gameState.clickPower, gameState.level, loading])

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
        magnumCoins: prev.magnumCoins + prev.clickPower,
        stars: prev.stars + 0.0001 * (1 + (upgrades.find((u) => u.id === "star_multiplier")?.level || 0)),
        energy: prev.energy - 1,
        clickAnimating: true,
        energyAnimating: true,
        totalClicks: prev.totalClicks + 1,
        level: Math.floor((prev.totalClicks + 1) / 100) + 1,
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
    },
    [gameState.energy, telegramId, isClicking, canClick, upgrades],
  )

  const openCase = useCallback(
    (caseItem: CaseItem) => {
      if (gameState.magnumCoins < caseItem.price) return

      setOpeningCase(true)
      setSelectedCase(caseItem)
      setCaseOpeningProgress(0)

      const progressInterval = setInterval(() => {
        setCaseOpeningProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 2
        })
      }, 40)

      setTimeout(() => {
        clearInterval(progressInterval)
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

        setGameState((prev) => ({
          ...prev,
          magnumCoins: newCoins,
          stars: newStars,
          energy: newEnergy,
        }))

        setCaseResult(rewards)
        setOpeningCase(false)
        setCaseOpeningProgress(0)
      }, 2000)
    },
    [gameState],
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

  const buyUpgrade = useCallback(
    async (upgradeId: string) => {
      const upgrade = upgrades.find((u) => u.id === upgradeId)
      if (!upgrade || gameState.magnumCoins < upgrade.price || upgrade.level >= upgrade.maxLevel) return

      // Update local state immediately for responsiveness
      setGameState((prev) => ({
        ...prev,
        magnumCoins: prev.magnumCoins - upgrade.price,
        clickPower: upgradeId === "click_power" ? prev.clickPower + 1 : prev.clickPower,
        maxEnergy: upgradeId === "energy_capacity" ? prev.maxEnergy + 10 : prev.maxEnergy,
      }))

      setUpgrades((prev) =>
        prev.map((u) => (u.id === upgradeId ? { ...u, level: u.level + 1, price: Math.floor(u.price * 1.5) } : u)),
      )

      // Sync with API
      if (telegramId) {
        try {
          const response = await fetch('/api/upgrades', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              telegramId,
              upgradeId,
              level: upgrade.level + 1,
            }),
          })
          
          const data = await response.json()
          if (!data.success) {
            console.warn('Failed to sync upgrade with API:', data.error)
          }
        } catch (error) {
          console.warn('Failed to sync upgrade with API:', error)
        }
      }
    },
    [gameState.magnumCoins, upgrades, telegramId],
  )

  const renderHomeScreen = () => (
    <div className="flex-1 flex flex-col mobile-safe-area mobile-compact space-y-4 relative touch-optimized no-overscroll">
      <div className="flex justify-end pt-2 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mobile-button w-10 h-10 rounded-full bg-card/50 backdrop-blur-md border border-border/50 hover:bg-accent/20 touch-optimized"
          onClick={() => setShowProfile(true)}
        >
          <User className="w-5 h-5 text-foreground" />
        </Button>
      </div>

      <Card className="card-gradient p-4 hw-accelerated mx-4">
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

      <div className="grid grid-cols-2 mobile-grid-compact px-4">
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

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="relative">
          <Button
            onClick={handleClick}
            onTouchStart={handleClick}
            disabled={gameState.energy <= 0}
            className={`w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 border-4 border-amber-300 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              gameState.clickAnimating ? "scale-95" : "scale-100"
            }`}
            size="lg"
          >
            <div className="text-6xl">🪙</div>
          </Button>
        </div>
      </div>

      <div className="px-4">
        <Button
          onClick={() => setShowUpgrades(true)}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary h-14 text-lg font-bold"
        >
          <ArrowUp className="w-6 h-6 mr-2" />
          Улучшения
        </Button>
      </div>

      {showUpgrades && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="card-gradient p-6 max-w-md w-full max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center space-x-2">
                <ArrowUp className="w-6 h-6 text-primary" />
                <span>Улучшения</span>
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowUpgrades(false)} className="w-8 h-8 rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-accent/10">
              <Coins className="w-5 h-5 text-accent" />
              <span className="text-foreground">Баланс:</span>
              <span className="font-bold text-accent">{formatNumber(gameState.magnumCoins)} MC</span>
            </div>

            <div className="space-y-3">
              {upgrades.map((upgrade) => (
                <Card key={upgrade.id} className="p-4 bg-card/50 border border-border/50">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{upgrade.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-foreground">{upgrade.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          Ур. {upgrade.level}/{upgrade.maxLevel}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{upgrade.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-accent">{upgrade.effect}</span>
                        <Button
                          size="sm"
                          onClick={() => buyUpgrade(upgrade.id)}
                          disabled={gameState.magnumCoins < upgrade.price || upgrade.level >= upgrade.maxLevel}
                          className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary"
                        >
                          {upgrade.level >= upgrade.maxLevel ? "МАКС" : `${upgrade.price} MC`}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={(upgrade.level / upgrade.maxLevel) * 100} className="h-1 bg-muted" />
                  </div>
                </Card>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Совет</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Улучшайте силу клика для быстрого заработка монет, а затем увеличивайте энергию для долгой игры!
              </p>
            </div>
          </Card>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="card-gradient p-6 max-w-sm mx-4 w-full space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Профиль игрока</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowProfile(false)} className="w-8 h-8 rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl mx-auto">
                👤
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Игрок #{Math.floor(Math.random() * 10000)}</h3>
                <p className="text-sm text-muted-foreground">Уровень {gameState.level}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                <div className="flex items-center space-x-2">
                  <Coins className="w-5 h-5 text-accent" />
                  <span className="text-foreground">Всего заработано</span>
                </div>
                <span className="font-bold text-accent">{formatNumber(gameState.magnumCoins)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-foreground">Звезды</span>
                </div>
                <span className="font-bold text-yellow-500">{formatNumber(gameState.stars)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Всего кликов</span>
                </div>
                <span className="font-bold text-primary">{formatNumber(gameState.totalClicks)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  <span className="text-foreground">Сила клика</span>
                </div>
                <span className="font-bold text-purple-400">{gameState.clickPower}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button className="w-full bg-gradient-to-r from-primary to-accent" disabled>
                <Settings className="w-4 h-4 mr-2" />
                Настройки (скоро)
              </Button>
              <Button variant="outline" className="w-full bg-transparent" disabled>
                <Trophy className="w-4 h-4 mr-2" />
                Достижения (скоро)
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Играет с {new Date().toLocaleDateString("ru-RU")}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )

  const renderCasesScreen = () => (
    <div className="flex-1 flex flex-col mobile-safe-area mobile-compact overflow-hidden">
      <div className="text-center space-y-2 p-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center space-x-2">
          <Package className="w-6 h-6 text-primary" />
          <span>Магазин кейсов</span>
        </h1>
        <p className="text-sm text-muted-foreground">Откройте кейсы и получите награды!</p>
      </div>
      
      <div className="flex-1 overflow-y-auto mobile-scroll no-overscroll px-4 space-y-4 pb-4">

      <Card className="card-gradient p-4 hw-accelerated">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-foreground">Ваш баланс:</span>
          </div>
          <span className="text-lg font-bold text-accent">{formatNumber(gameState.magnumCoins)} MC</span>
        </div>
      </Card>

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
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl border border-border/50">
                {caseItem.image}
              </div>

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

            <div
              className="mt-3 h-1 rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-30"
              style={{ color: caseItem.glowColor.replace("0.5", "1") }}
            />
          </Card>
        ))}
      </div>

      {openingCase && selectedCase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="card-gradient p-8 text-center space-y-6 max-w-sm mx-4">
            <div className="relative">
              <div
                className={`text-6xl transition-transform duration-500 ${caseOpeningProgress > 50 ? "animate-bounce" : "animate-pulse"}`}
              >
                {selectedCase.image}
              </div>
              {caseOpeningProgress > 75 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl animate-spin">✨</div>
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground">Открываем {selectedCase.name}...</h2>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary via-accent to-primary h-3 rounded-full transition-all duration-100 ease-out relative"
                style={{ width: `${caseOpeningProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {caseOpeningProgress < 30 && "Подготавливаем кейс..."}
              {caseOpeningProgress >= 30 && caseOpeningProgress < 70 && "Открываем замок..."}
              {caseOpeningProgress >= 70 && caseOpeningProgress < 95 && "Извлекаем награды..."}
              {caseOpeningProgress >= 95 && "Почти готово!"}
            </p>
          </Card>
        </div>
      )}

      {caseResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="card-gradient p-8 text-center space-y-6 max-w-sm mx-4">
            <div className="text-4xl animate-bounce">🎉</div>
            <h2 className="text-xl font-bold text-foreground">Поздравляем!</h2>
            <div className="space-y-2">
              {caseResult.map((reward: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-accent/10 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
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

  // Show loading screen while initializing
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="card-gradient p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl mx-auto animate-spin">
            🪙
          </div>
          <h2 className="text-xl font-bold text-foreground">Загрузка...</h2>
          <p className="text-sm text-muted-foreground">Инициализация игры</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col relative touch-optimized no-overscroll">
      <div className="flex-1 overflow-hidden">{renderContent()}</div>

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