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
    level: 1,
  })

  const [activeTab, setActiveTab] = useState("home")
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null)
  const [openingCase, setOpeningCase] = useState(false)
  const [caseResult, setCaseResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [telegramId, setTelegramId] = useState<number | null>(null)

  // Get Telegram user ID from web app data
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      const userId = tg.initDataUnsafe?.user?.id
      if (userId) {
        setTelegramId(userId)
        loadUserData(userId)
      }
    } else {
      // For development/testing
      setTelegramId(12345)
      loadUserData(12345)
    }
  }, [])

  const loadUserData = async (userId: number) => {
    try {
      const response = await fetch(`/api/users?telegramId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setGameState(prev => ({
          ...prev,
          magnumCoins: data.user.magnumCoins,
          stars: data.user.stars,
          energy: data.user.energy,
          maxEnergy: data.user.maxEnergy,
          totalClicks: data.user.totalClicks,
          level: data.user.level,
          lastEnergyRestore: new Date(data.user.lastEnergyRestore).getTime()
        }))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

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
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (gameState.energy <= 0 || !telegramId) return

      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      try {
        const response = await fetch('/api/click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ telegramId }),
        })

        const data = await response.json()

        if (data.success) {
          setGameState((prev) => ({
            ...prev,
            magnumCoins: data.user.magnumCoins,
            stars: data.user.stars,
            energy: data.user.energy,
            totalClicks: data.user.totalClicks,
            level: data.user.level,
            clickAnimating: true,
            energyAnimating: true,
            rewardPopups: [...prev.rewardPopups, { id: Date.now(), x, y }],
          }))

          setTimeout(() => {
            setGameState((prev) => ({ ...prev, clickAnimating: false, energyAnimating: false }))
          }, 800)

          setTimeout(() => {
            setGameState((prev) => ({
              ...prev,
              rewardPopups: prev.rewardPopups.filter((popup) => popup.id !== Date.now()),
            }))
          }, 1200)
        }
      } catch (error) {
        console.error('Error processing click:', error)
      }
    },
    [gameState.energy, telegramId],
  )

  const openCase = useCallback(
    async (caseItem: CaseItem) => {
      if (gameState.magnumCoins < caseItem.price || !telegramId) return

      setOpeningCase(true)
      setSelectedCase(caseItem)

      try {
        const response = await fetch('/api/cases/open', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            telegramId, 
            caseType: caseItem.id 
          }),
        })

        const data = await response.json()

        if (data.success) {
          setGameState((prev) => ({
            ...prev,
            magnumCoins: data.user.magnumCoins,
            stars: data.user.stars,
            energy: data.user.energy,
          }))

          setCaseResult(data.rewards)
        } else {
          console.error('Error opening case:', data.error)
        }
      } catch (error) {
        console.error('Error opening case:', error)
      } finally {
        setOpeningCase(false)
      }
    },
    [gameState.magnumCoins, telegramId],
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

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  const renderHomeScreen = () => (
    <div className="flex-1 flex flex-col p-6 space-y-6 relative">
      {/* Profile Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 rounded-full bg-card/50 backdrop-blur-md border border-border/50 hover:bg-accent/20"
        >
          <User className="w-5 h-5 text-foreground" />
        </Button>
      </div>

      {/* Energy Bar */}
      <Card className="card-gradient p-4">
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
      <div className="grid grid-cols-2 gap-4">
        <Card className="card-gradient p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Coins className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-bold text-foreground">Magnum</h3>
          </div>
          <p className="text-xl font-bold text-accent">{formatNumber(gameState.magnumCoins)}</p>
        </Card>

        <Card className="card-gradient p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-bold text-foreground">Stars</h3>
          </div>
          <p className="text-xl font-bold text-yellow-400">{formatNumber(gameState.stars)}</p>
        </Card>
      </div>

      {/* Clicker Button */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <Button
            onClick={handleClick}
            disabled={gameState.energy <= 0}
            className={`w-40 h-40 rounded-full bg-gradient-to-br from-primary via-accent to-primary hover:from-accent hover:to-primary transition-all duration-300 pulse-glow disabled:opacity-50 disabled:cursor-not-allowed ${
              gameState.clickAnimating ? "coin-bounce" : ""
            }`}
            size="lg"
          >
            <div className="flex flex-col items-center space-y-2">
              <Coins className="w-12 h-12 text-primary-foreground" />
              <span className="text-sm font-bold text-primary-foreground">
                {gameState.energy > 0 ? "КЛИК" : "НЕТ ЭНЕРГИИ"}
              </span>
            </div>
          </Button>

          {/* Reward Popups */}
          {gameState.rewardPopups.map((popup) => (
            <div
              key={popup.id}
              className="absolute pointer-events-none reward-popup text-accent font-bold text-base z-10"
              style={{ left: popup.x, top: popup.y }}
            >
              +1 🪙 +0.0001 ⭐
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <Card className="card-gradient p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
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
            <p className="text-lg font-bold text-primary">{gameState.level}</p>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderCasesScreen = () => (
    <div className="flex-1 p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center space-x-2">
          <Package className="w-6 h-6 text-primary" />
          <span>Магазин кейсов</span>
        </h1>
        <p className="text-sm text-muted-foreground">Откройте кейсы и получите награды!</p>
      </div>

      {/* Balance Display */}
      <Card className="card-gradient p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-foreground">Ваш баланс:</span>
          </div>
          <span className="text-lg font-bold text-accent">{formatNumber(gameState.magnumCoins)} MC</span>
        </div>
      </Card>

      {/* Cases Grid */}
      <div className="space-y-4">
        {cases.map((caseItem, index) => (
          <Card
            key={caseItem.id}
            className={`case-card p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
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
    </div>
  )

  const renderEventsScreen = () => (
    <div className="flex-1 flex items-center justify-center p-6 coming-soon-bg">
      <Card className="coming-soon-card p-8 text-center space-y-6 max-w-md mx-auto coming-soon-float">
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
    <div className="flex-1 flex items-center justify-center p-6 coming-soon-bg">
      <Card className="coming-soon-card p-8 text-center space-y-6 max-w-md mx-auto coming-soon-float">
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
              <span className="font-bold text-yellow-400">{formatNumber(gameState.stars)}</span>
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

  return (
    <div className="min-h-screen gradient-bg flex flex-col relative">
      {/* Main Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <nav className="border-t border-border bg-card/50 backdrop-blur-md">
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
              className={`flex flex-col items-center space-y-1 p-3 h-auto transition-all duration-200 ${
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
