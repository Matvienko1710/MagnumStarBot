"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Home, Package, Calendar, Wallet } from "lucide-react"
import { useAuthContext } from "./auth-provider"
import { useGameAPI } from "@/lib/hooks/useGameAPI"
import { LoginScreen } from "./login-screen"

import HomePage from "./home-page"
import CasesPage from "./cases-page"
import CaseOpeningScreen from "./case-opening-screen"
import EventsPage from "./events-page"
import WalletPage from "./wallet-page"

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
  experience: number
  experienceToNext: number
  prestigeLevel: number
  dailyStreak: number
  lastLoginDate: string
  achievements: string[]
  inventory: InventoryItem[]
  dailyRewards: DailyReward[]
  lastDailyReward: string
  autoClicker: AutoClickerState
  boosts: BoostState[]
  statistics: GameStatistics
}

interface CaseItem {
  id: string
  name: string
  price: number
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic"
  rewards: Array<{
    type: "coins" | "stars" | "energy" | "boost" | "item"
    min: number
    max: number
    chance: number
    itemId?: string
  }>
  image: string
  glowColor: string
  description: string
  dailyLimit?: number
  specialOffer?: boolean
  category: "standard" | "premium" | "event" | "seasonal"
  unlockLevel: number
  tags: string[]
  animation: string
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
  category: "click" | "energy" | "passive" | "special"
  unlockLevel: number
  prerequisite?: string
  multiplier: number
}

interface HistoryItem {
  id: string
  playerName: string
  caseName: string
  reward: { type: string; amount: number; itemName?: string }
  rarity: string
  timestamp: number
  playerId: string
  location: string
  isRare: boolean
}

interface InventoryItem {
  id: string
  name: string
  type: "boost" | "decoration" | "tool" | "collectible"
  rarity: string
  quantity: number
  description: string
  icon: string
  effects?: { [key: string]: number }
}

interface DailyReward {
  day: number
  type: "coins" | "stars" | "energy" | "boost" | "case"
  amount: number
  claimed: boolean
  special?: boolean
}

interface AutoClickerState {
  active: boolean
  level: number
  clicksPerSecond: number
  duration: number
  remaining: number
}

interface BoostState {
  id: string
  name: string
  type: "click_multiplier" | "energy_regen" | "coin_rain" | "lucky_chance"
  multiplier: number
  duration: number
  remaining: number
  icon: string
}

interface GameStatistics {
  totalEarned: number
  totalSpent: number
  casesOpened: number
  rareItemsFound: number
  daysPlayed: number
  maxClickStreak: number
  currentClickStreak: number
  prestigeCount: number
}

export function TelegramClickerApp() {
  const { isAuthenticated, loading: authLoading, user } = useAuthContext()
  const gameAPI = useGameAPI()

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
    experience: 0,
    experienceToNext: 100,
    prestigeLevel: 0,
    dailyStreak: 0,
    lastLoginDate: new Date().toDateString(),
    achievements: [],
    inventory: [],
    dailyRewards: [],
    lastDailyReward: "",
    autoClicker: {
      active: false,
      level: 0,
      clicksPerSecond: 0,
      duration: 0,
      remaining: 0,
    },
    boosts: [],
    statistics: {
      totalEarned: 0,
      totalSpent: 0,
      casesOpened: 0,
      rareItemsFound: 0,
      daysPlayed: 1,
      maxClickStreak: 0,
      currentClickStreak: 0,
      prestigeCount: 0,
    },
  })

  const [activeTab, setActiveTab] = useState("home")
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null)
  const [openingCase, setOpeningCase] = useState(false)
  const [caseResult, setCaseResult] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showUpgrades, setShowUpgrades] = useState(false)
  const [showCaseOpening, setShowCaseOpening] = useState(false)
  const [rouletteItems, setRouletteItems] = useState<any[]>([])
  const [rouletteSpinning, setRouletteSpinning] = useState(false)
  const [rouletteOffset, setRouletteOffset] = useState(0)
  const [roulettePhase, setRoulettePhase] = useState<"ready" | "spinning" | "slowing" | "stopped">("ready")

  const [recentDrops, setRecentDrops] = useState<HistoryItem[]>([])
  const [historyScrollIndex, setHistoryScrollIndex] = useState(0)

  const [showInventory, setShowInventory] = useState(false)
  const [showDailyRewards, setShowDailyRewards] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [coinRainActive, setCoinRainActive] = useState(false)
  const [coinRainCoins, setCoinRainCoins] = useState<Array<{ id: number; x: number; y: number; collected: boolean }>>(
    [],
  )

  useEffect(() => {
    if (isAuthenticated && user?.gameData) {
      setGameState((prev) => ({
        ...prev,
        ...user.gameData,
        clickAnimating: false,
        energyAnimating: false,
      }))
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!isAuthenticated) return

    const syncInterval = setInterval(async () => {
      try {
        await gameAPI.updateStats(gameState)
      } catch (error) {
        console.error("Failed to sync game state:", error)
      }
    }, 30000) // Sync every 30 seconds

    return () => clearInterval(syncInterval)
  }, [isAuthenticated, gameState, gameAPI])

  const handleClick = useCallback(async () => {
    if (gameState.energy < 1) return

    try {
      // Optimistic update for better UX
      setGameState((prev) => ({
        ...prev,
        clickAnimating: true,
        energy: prev.energy - 1,
        magnumCoins: prev.magnumCoins + prev.clickPower,
        totalClicks: prev.totalClicks + 1,
      }))

      // API call to server
      const result = await gameAPI.click(gameState.clickPower, 1)

      if (result.success) {
        setGameState((prev) => ({
          ...prev,
          ...result.newStats,
          clickAnimating: false,
        }))
      }
    } catch (error) {
      console.error("Click failed:", error)
      // Revert optimistic update on error
      setGameState((prev) => ({
        ...prev,
        clickAnimating: false,
        energy: prev.energy + 1,
        magnumCoins: prev.magnumCoins - prev.clickPower,
        totalClicks: prev.totalClicks - 1,
      }))
    }
  }, [gameState.energy, gameState.clickPower, gameAPI])

  const openCase = useCallback(
    async (caseItem: CaseItem) => {
      if (gameState.magnumCoins < caseItem.price) return

      try {
        setSelectedCase(caseItem)
        setShowCaseOpening(true)
        setRoulettePhase("ready")

        // Generate roulette items (client-side for animation)
        const items = []
        const winningIndex = 49

        for (let i = 0; i < 100; i++) {
          let reward, rarity

          if (i === winningIndex) {
            const totalChance = caseItem.rewards.reduce((sum, r) => sum + r.chance, 0)
            let random = Math.random() * totalChance

            for (const r of caseItem.rewards) {
              random -= r.chance
              if (random <= 0) {
                reward = r
                break
              }
            }
            rarity = caseItem.rarity
          } else {
            const rand = Math.random() * 100
            if (rand < 50) {
              reward = { type: "coins", min: 10, max: 100, chance: 50 }
              rarity = "common"
            } else if (rand < 75) {
              reward = { type: "coins", min: 100, max: 500, chance: 25 }
              rarity = "rare"
            } else if (rand < 90) {
              reward = { type: "coins", min: 500, max: 1500, chance: 15 }
              rarity = "epic"
            } else if (rand < 98) {
              reward = { type: "coins", min: 1500, max: 5000, chance: 8 }
              rarity = "legendary"
            } else {
              reward = { type: "stars", min: 10, max: 50, chance: 2 }
              rarity = "mythic"
            }
          }

          const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min
          items.push({
            type: reward.type,
            amount,
            rarity,
            isWinning: i === winningIndex,
            itemId: reward.itemId,
          })
        }

        setRouletteItems(items)
        setRouletteOffset(0)
      } catch (error) {
        console.error("Failed to prepare case opening:", error)
      }
    },
    [gameState.magnumCoins],
  )

  const spinRoulette = useCallback(async () => {
    if (rouletteSpinning || !selectedCase || roulettePhase !== "ready") return

    try {
      setRouletteSpinning(true)
      setRoulettePhase("spinning")

      // Call API to open case
      const result = await gameAPI.openCase(selectedCase.id)

      if (!result.success) {
        throw new Error(result.error || "Case opening failed")
      }

      // Update local state with server response
      setGameState((prev) => ({
        ...prev,
        ...result.newStats,
      }))

      // Continue with animation...
      const itemWidth = 120
      const winningIndex = 49
      const centerPosition = winningIndex * itemWidth
      const randomOffset = Math.random() * 40 - 20
      const finalOffset = -(centerPosition + randomOffset - window.innerWidth / 2 + itemWidth / 2)
      const extraSpins = 4
      const totalOffset = finalOffset - extraSpins * itemWidth * 100

      // Animation phases
      setTimeout(() => setRouletteOffset(totalOffset * 0.1), 100)
      setTimeout(() => setRouletteOffset(totalOffset * 0.4), 1000)
      setTimeout(() => setRouletteOffset(totalOffset * 0.7), 3000)
      setTimeout(() => {
        setRoulettePhase("slowing")
        setRouletteOffset(totalOffset * 0.9)
      }, 5000)
      setTimeout(() => setRouletteOffset(totalOffset), 7000)

      // Show result
      setTimeout(() => {
        setCaseResult([result.reward])
        setRouletteSpinning(false)
        setRoulettePhase("stopped")

        // Add to history
        const newDrop: HistoryItem = {
          id: `drop_${Date.now()}`,
          playerName: user?.username || "Вы",
          caseName: selectedCase.name,
          reward: {
            type: result.reward.type,
            amount: result.reward.amount,
          },
          rarity: result.reward.rarity,
          timestamp: Date.now(),
          playerId: user?.telegramId || "you",
          location: "Ваш город",
          isRare: result.reward.rarity === "legendary" || result.reward.rarity === "mythic",
        }

        setRecentDrops((prev) => [newDrop, ...prev.slice(0, 49)])

        // Auto close after 4 seconds
        setTimeout(() => {
          setShowCaseOpening(false)
          setSelectedCase(null)
          setCaseResult(null)
          setRoulettePhase("ready")
        }, 4000)
      }, 9000)
    } catch (error) {
      console.error("Case opening failed:", error)
      setRouletteSpinning(false)
      setRoulettePhase("ready")
      // Show error to user
    }
  }, [rouletteSpinning, selectedCase, roulettePhase, rouletteItems, gameAPI, user])

  const [cases] = useState<CaseItem[]>([
    {
      id: "starter",
      name: "Стартовый кейс",
      price: 100,
      rarity: "common",
      rewards: [
        { type: "coins", min: 50, max: 200, chance: 70 },
        { type: "coins", min: 200, max: 500, chance: 25 },
        { type: "boost", min: 1, max: 1, chance: 5, itemId: "click_boost_small" },
      ],
      image: "📦",
      glowColor: "rgba(156, 163, 175, 0.5)",
      description: "Идеальный выбор для новичков",
      category: "standard",
      unlockLevel: 1,
      tags: ["новичок", "базовый"],
      animation: "bounce",
    },
    {
      id: "golden",
      name: "Золотой кейс",
      price: 500,
      rarity: "rare",
      rewards: [
        { type: "coins", min: 300, max: 800, chance: 50 },
        { type: "coins", min: 800, max: 1500, chance: 30 },
        { type: "stars", min: 5, max: 15, chance: 15 },
        { type: "boost", min: 1, max: 1, chance: 5, itemId: "energy_boost" },
      ],
      image: "🟨",
      glowColor: "rgba(59, 130, 246, 0.5)",
      description: "Больше шансов на хорошие награды",
      dailyLimit: 5,
      category: "standard",
      unlockLevel: 5,
      tags: ["популярный", "золото"],
      animation: "glow",
    },
    {
      id: "platinum",
      name: "Платиновый кейс",
      price: 1500,
      rarity: "epic",
      rewards: [
        { type: "coins", min: 1000, max: 3000, chance: 40 },
        { type: "coins", min: 3000, max: 6000, chance: 30 },
        { type: "stars", min: 10, max: 30, chance: 20 },
        { type: "boost", min: 1, max: 1, chance: 10, itemId: "coin_rain" },
      ],
      image: "💎",
      glowColor: "rgba(147, 51, 234, 0.5)",
      description: "Премиальные награды для опытных игроков",
      category: "premium",
      unlockLevel: 10,
      tags: ["премиум", "платина"],
      animation: "pulse",
    },
  ])

  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: "click_power",
      name: "Сила клика",
      description: "Увеличивает количество монет за клик",
      price: 100,
      level: 1,
      maxLevel: 100,
      effect: "+1 монета за клик",
      icon: "💪",
      category: "click",
      unlockLevel: 1,
      multiplier: 1.5,
    },
    {
      id: "energy_capacity",
      name: "Емкость энергии",
      description: "Увеличивает максимальную энергию",
      price: 200,
      level: 1,
      maxLevel: 50,
      effect: "+10 максимальной энергии",
      icon: "🔋",
      category: "energy",
      unlockLevel: 1,
      multiplier: 1.6,
    },
  ])

  const closeCaseOpening = () => {
    setShowCaseOpening(false)
    setSelectedCase(null)
    setRouletteSpinning(false)
    setRoulettePhase("ready")
  }

  // Show loading screen while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />
  }

  const renderContent = () => {
    if (showCaseOpening) {
      return (
        <CaseOpeningScreen
          selectedCase={selectedCase}
          rouletteItems={rouletteItems}
          rouletteSpinning={rouletteSpinning}
          rouletteOffset={rouletteOffset}
          roulettePhase={roulettePhase}
          caseResult={caseResult}
          onClose={closeCaseOpening}
          spinRoulette={spinRoulette}
        />
      )
    }

    switch (activeTab) {
      case "home":
        return (
          <HomePage
            gameState={gameState}
            setGameState={setGameState}
            upgrades={upgrades}
            setUpgrades={setUpgrades}
            showProfile={showProfile}
            setShowProfile={setShowProfile}
            showUpgrades={showUpgrades}
            setShowUpgrades={setShowUpgrades}
            onClick={handleClick}
          />
        )
      case "cases":
        return (
          <CasesPage
            gameState={gameState}
            cases={cases}
            recentDrops={recentDrops}
            historyScrollIndex={historyScrollIndex}
            setHistoryScrollIndex={setHistoryScrollIndex}
            openCase={openCase}
          />
        )
      case "events":
        return <EventsPage gameState={gameState} />
      case "wallet":
        return <WalletPage gameState={gameState} />
      default:
        return (
          <HomePage
            gameState={gameState}
            setGameState={setGameState}
            upgrades={upgrades}
            setUpgrades={setUpgrades}
            showProfile={showProfile}
            setShowProfile={setShowProfile}
            showUpgrades={showUpgrades}
            setShowUpgrades={setShowUpgrades}
            onClick={handleClick}
          />
        )
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col relative touch-optimized no-overscroll">
      {renderContent()}

      {/* Bottom Navigation */}
      {!showCaseOpening && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border/50 mobile-safe-area-bottom">
          <div className="flex items-center justify-around py-2 px-4">
            {[
              { id: "home", icon: Home, label: "Главная" },
              { id: "cases", icon: Package, label: "Кейсы" },
              { id: "events", icon: Calendar, label: "События" },
              { id: "wallet", icon: Wallet, label: "Кошелек" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 mobile-button touch-optimized ${
                  activeTab === tab.id
                    ? "text-primary-foreground bg-primary/30 border border-primary/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
