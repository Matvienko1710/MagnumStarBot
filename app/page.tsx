"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Home, Package, Calendar, Wallet } from "lucide-react"

import HomePage from "@/components/home-page"
import CasesPage from "@/components/cases-page"
import CaseOpeningScreen from "@/components/case-opening-screen"
import EventsPage from "@/components/events-page"
import WalletPage from "@/components/wallet-page"

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
  telegramId?: number
  username?: string
  firstName?: string
  lastName?: string
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

  // Telegram API integration
  useEffect(() => {
    const initTelegram = () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        tg.ready()
        tg.expand()
        const userData = tg.initDataUnsafe?.user
        
        console.log('Telegram user data:', userData)
        
        if (userData) {
          fetchUser(userData.id, userData)
        } else {
          // Fallback for testing
          fetchUser(123456789)
        }
      } else {
        // Fallback for development
        fetchUser(123456789)
      }
    }
    initTelegram()
  }, [])

  const fetchUser = async (telegramId: number, telegramUser?: any) => {
    try {
      console.log('Fetching user with telegramId:', telegramId)
      const response = await fetch(`/api/users?telegramId=${telegramId}`)
      const data = await response.json()
      
      console.log('User fetch response:', data)
      
      if (data.success) {
        setGameState(prev => ({
          ...prev,
          ...data.user,
          telegramId: telegramId,
          username: telegramUser?.username || data.user.username,
          firstName: telegramUser?.first_name || data.user.firstName,
          lastName: telegramUser?.last_name || data.user.lastName,
        }))
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const handleClick = async () => {
    if (gameState.energy <= 0) return

    try {
      const response = await fetch('/api/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: gameState.telegramId || 123456789 }),
      })
      const data = await response.json()
      
      if (data.success) {
        setGameState(prev => ({
          ...prev,
          ...data.user,
          clickAnimating: true,
          energyAnimating: true,
        }))
        
        setTimeout(() => {
          setGameState(prev => ({ ...prev, clickAnimating: false, energyAnimating: false }))
        }, 300)
      }
    } catch (error) {
      console.error('Error clicking:', error)
    }
  }

  // Save to localStorage as backup
  useEffect(() => {
    if (gameState.telegramId) {
      localStorage.setItem('magnumClickerState', JSON.stringify(gameState))
    }
  }, [gameState])

  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('magnumClickerState')
    if (savedState && !gameState.telegramId) {
      try {
        const parsedState = JSON.parse(savedState)
        setGameState(prev => ({ ...prev, ...parsedState }))
      } catch (error) {
        console.error('Error loading saved state:', error)
      }
    }
  }, [])

  useEffect(() => {
    const generateInitialHistory = () => {
      const names = [
        "Игрок#1234",
        "Игрок#5678",
        "Игрок#9012",
        "Игрок#3456",
        "Игрок#7890",
        "Игрок#2468",
        "Игрок#1357",
        "Игрок#8642",
      ]
      const caseNames = ["Стартовый кейс", "Золотой кейс", "Платиновый кейс", "Легендарный кейс", "Мифический кейс"]
      const rarities = ["common", "rare", "epic", "legendary", "mythic"]
      const locations = ["Москва", "СПб", "Казань", "Екб", "Новосибирск", "Краснодар"]

      const history: HistoryItem[] = []
      for (let i = 0; i < 50; i++) {
        const rarity = rarities[Math.floor(Math.random() * rarities.length)]
        const amount = Math.floor(Math.random() * 10000) + 100
        const isRare = rarity === "legendary" || rarity === "mythic"

        history.push({
          id: `initial_${i}`,
          playerName: names[Math.floor(Math.random() * names.length)],
          caseName: caseNames[Math.floor(Math.random() * caseNames.length)],
          reward: {
            type: "coins",
            amount,
            itemName: isRare ? `Редкий предмет #${i}` : undefined,
          },
          rarity,
          timestamp: Date.now() - Math.random() * 3600000,
          playerId: `player_${Math.floor(Math.random() * 100000)}`,
          location: locations[Math.floor(Math.random() * locations.length)],
          isRare,
        })
      }
      setRecentDrops(history)
    }

    const initializeDailyRewards = () => {
      const rewards: DailyReward[] = []
      for (let day = 1; day <= 7; day++) {
        let reward: DailyReward
        if (day === 7) {
          reward = { day, type: "case", amount: 1, claimed: false, special: true }
        } else if (day % 3 === 0) {
          reward = { day, type: "stars", amount: day * 10, claimed: false }
        } else if (day % 2 === 0) {
          reward = { day, type: "energy", amount: 50, claimed: false }
        } else {
          reward = { day, type: "coins", amount: day * 100, claimed: false }
        }
        rewards.push(reward)
      }

      setGameState((prev) => ({ ...prev, dailyRewards: rewards }))
    }

    generateInitialHistory()
    initializeDailyRewards()

    const energyInterval = setInterval(() => {
      setGameState((prev) => {
        const now = Date.now()
        const timeDiff = now - prev.lastEnergyRestore
        const energyToRestore = Math.floor(timeDiff / 30000)

        const newState = { ...prev }

        // Восстановление энергии
        if (energyToRestore > 0 && prev.energy < prev.maxEnergy) {
          newState.energy = Math.min(prev.maxEnergy, prev.energy + energyToRestore)
          newState.lastEnergyRestore = now
        }

        // Автокликер
        if (prev.autoClicker.active && prev.autoClicker.remaining > 0) {
          const autoClicks = Math.floor(timeDiff / 1000) * prev.autoClicker.clicksPerSecond
          if (autoClicks > 0) {
            newState.magnumCoins += autoClicks * prev.clickPower
            newState.autoClicker.remaining = Math.max(0, prev.autoClicker.remaining - Math.floor(timeDiff / 1000))
            newState.statistics.totalEarned += autoClicks * prev.clickPower
          }
        }

        // Обновление бустов
        newState.boosts = prev.boosts
          .map((boost) => ({
            ...boost,
            remaining: Math.max(0, boost.remaining - Math.floor(timeDiff / 1000)),
          }))
          .filter((boost) => boost.remaining > 0)

        return newState
      })
    }, 1000)

    return () => clearInterval(energyInterval)
  }, [])

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
    {
      id: "legendary",
      name: "Легендарный кейс",
      price: 5000,
      rarity: "legendary",
      rewards: [
        { type: "coins", min: 5000, max: 15000, chance: 50 },
        { type: "coins", min: 15000, max: 30000, chance: 25 },
        { type: "stars", min: 25, max: 75, chance: 15 },
        { type: "boost", min: 1, max: 1, chance: 10, itemId: "mega_multiplier" },
      ],
      image: "👑",
      glowColor: "rgba(245, 158, 11, 0.5)",
      description: "Эксклюзивные награды высшего уровня",
      specialOffer: true,
      category: "premium",
      unlockLevel: 20,
      tags: ["легендарный", "эксклюзив"],
      animation: "rotate",
    },
    {
      id: "mythic",
      name: "Мифический кейс",
      price: 15000,
      rarity: "mythic",
      rewards: [
        { type: "coins", min: 10000, max: 50000, chance: 40 },
        { type: "stars", min: 50, max: 200, chance: 30 },
        { type: "boost", min: 1, max: 1, chance: 20, itemId: "auto_clicker" },
        { type: "item", min: 1, max: 1, chance: 10, itemId: "mythic_artifact" },
      ],
      image: "🌟",
      glowColor: "rgba(168, 85, 247, 0.8)",
      description: "Невероятно редкие и мощные награды",
      category: "event",
      unlockLevel: 50,
      tags: ["мифический", "артефакт"],
      animation: "sparkle",
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
    {
      id: "energy_regen",
      name: "Восстановление энергии",
      description: "Ускоряет восстановление энергии",
      price: 300,
      level: 1,
      maxLevel: 30,
      effect: "+20% скорости восстановления",
      icon: "⚡",
      category: "energy",
      unlockLevel: 3,
      multiplier: 1.7,
    },
    {
      id: "star_multiplier",
      name: "Множитель звезд",
      description: "Увеличивает получение звезд из кейсов",
      price: 500,
      level: 1,
      maxLevel: 25,
      effect: "+10% звезд из кейсов",
      icon: "⭐",
      category: "special",
      unlockLevel: 5,
      multiplier: 1.8,
    },
    {
      id: "auto_clicker",
      name: "Автокликер",
      description: "Автоматически кликает за вас",
      price: 2000,
      level: 0,
      maxLevel: 20,
      effect: "+1 клик в секунду",
      icon: "🤖",
      category: "passive",
      unlockLevel: 15,
      multiplier: 2.0,
    },
    {
      id: "luck_boost",
      name: "Удача",
      description: "Увеличивает шанс редких наград",
      price: 1000,
      level: 0,
      maxLevel: 15,
      effect: "+5% шанс редких наград",
      icon: "🍀",
      category: "special",
      unlockLevel: 10,
      multiplier: 1.9,
    },
  ])

  const openCase = useCallback(
    (caseItem: CaseItem) => {
      if (gameState.magnumCoins < caseItem.price) return

      setSelectedCase(caseItem)
      setShowCaseOpening(true)
      setRoulettePhase("ready")

      const items = []
      const winningIndex = 49

      // Генерируем 100 предметов для рулетки
      for (let i = 0; i < 100; i++) {
        let reward: { type: string; min: number; max: number; chance: number; itemId?: string } = { type: "coins", min: 10, max: 100, chance: 50 }
        let rarity: string = "common"

        if (i === winningIndex) {
          // Выигрышный предмет
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
          // Обычные предметы
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
    },
    [gameState.magnumCoins],
  )

  const spinRoulette = useCallback(() => {
    if (rouletteSpinning || !selectedCase || roulettePhase !== "ready") return

    setRouletteSpinning(true)
    setRoulettePhase("spinning")

    // Списываем монеты
    setGameState((prev) => ({
      ...prev,
      magnumCoins: prev.magnumCoins - selectedCase.price,
      statistics: {
        ...prev.statistics,
        totalSpent: prev.statistics.totalSpent + selectedCase.price,
        casesOpened: prev.statistics.casesOpened + 1,
      },
    }))

    const itemWidth = 120 // Увеличиваем ширину для лучшей видимости
    const winningIndex = 49
    const centerPosition = winningIndex * itemWidth
    const randomOffset = Math.random() * 40 - 20 // Больше случайности
    const finalOffset = -(centerPosition + randomOffset - window.innerWidth / 2 + itemWidth / 2)

    // Добавляем больше оборотов для эффектности
    const extraSpins = 4
    const totalOffset = finalOffset - extraSpins * itemWidth * 100

    // Фаза 1: Медленный старт (1 секунда)
    setTimeout(() => {
      setRouletteOffset(totalOffset * 0.1)
    }, 100)

    // Фаза 2: Ускорение (2 секунды)
    setTimeout(() => {
      setRouletteOffset(totalOffset * 0.4)
    }, 1000)

    // Фаза 3: Максимальная скорость (2 секунды)
    setTimeout(() => {
      setRouletteOffset(totalOffset * 0.7)
    }, 3000)

    // Фаза 4: Замедление (3 секунды)
    setTimeout(() => {
      setRoulettePhase("slowing")
      setRouletteOffset(totalOffset * 0.9)
    }, 5000)

    // Фаза 5: Финальная остановка (2 секунды)
    setTimeout(() => {
      setRouletteOffset(totalOffset)
    }, 7000)

    // Показ результата (через 9 секунд)
    setTimeout(() => {
      const winningItem = rouletteItems[winningIndex]

      // Начисляем награду
      setGameState((prev) => {
        const newState = { ...prev }

        if (winningItem.type === "coins") {
          newState.magnumCoins += winningItem.amount
          newState.statistics.totalEarned += winningItem.amount
        } else if (winningItem.type === "stars") {
          newState.stars += winningItem.amount
        } else if (winningItem.type === "energy") {
          newState.energy = Math.min(prev.maxEnergy, prev.energy + winningItem.amount)
        }

        // Проверяем на редкий предмет
        if (winningItem.rarity === "legendary" || winningItem.rarity === "mythic") {
          newState.statistics.rareItemsFound += 1
        }

        return newState
      })

      // Добавляем в историю
      const newDrop: HistoryItem = {
        id: `drop_${Date.now()}`,
        playerName: `Игрок#${Math.floor(Math.random() * 10000)}`,
        caseName: selectedCase.name,
        reward: {
          type: winningItem.type,
          amount: winningItem.amount,
          itemName: winningItem.itemId ? `Предмет: ${winningItem.itemId}` : undefined,
        },
        rarity: winningItem.rarity,
        timestamp: Date.now(),
        playerId: `player_${Math.floor(Math.random() * 100000)}`,
        location: "Ваш город",
        isRare: winningItem.rarity === "legendary" || winningItem.rarity === "mythic",
      }

      setRecentDrops((prev) => [newDrop, ...prev.slice(0, 49)])

      setCaseResult([winningItem])
      setRouletteSpinning(false)
      setRoulettePhase("stopped")

      // Закрываем через 4 секунды
      setTimeout(() => {
        setShowCaseOpening(false)
        setSelectedCase(null)
        setCaseResult(null)
        setRoulettePhase("ready")
      }, 4000)
    }, 9000)
  }, [rouletteSpinning, selectedCase, roulettePhase, rouletteItems])

  const closeCaseOpening = () => {
    setShowCaseOpening(false)
    setSelectedCase(null)
    setRouletteSpinning(false)
    setRoulettePhase("ready")
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
                    ? "text-white bg-primary/20 border border-primary/30"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
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
