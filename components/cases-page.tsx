"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Package, Coins, Sparkles, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react"

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
  rewards: Array<{ type: "coins" | "stars" | "energy" | "boost" | "item"; min: number; max: number; chance: number; itemId?: string }>
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

interface HistoryItem {
  id: string
  playerName: string
  caseName: string
  reward: { type: string; amount: number }
  rarity: string
  timestamp: number
}

interface CasesPageProps {
  gameState: GameState
  cases: CaseItem[]
  recentDrops: HistoryItem[]
  historyScrollIndex: number
  setHistoryScrollIndex: (index: number) => void
  openCase: (caseItem: CaseItem) => void
}

export default function CasesPage({
  gameState,
  cases,
  recentDrops,
  historyScrollIndex,
  setHistoryScrollIndex,
  openCase,
}: CasesPageProps) {
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

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "⚪"
      case "rare":
        return "🔵"
      case "epic":
        return "🟣"
      case "legendary":
        return "🟡"
      case "mythic":
        return "🔴"
      default:
        return "⚪"
    }
  }

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (hours > 0) return `${hours}ч назад`
    if (minutes > 0) return `${minutes}м назад`
    return "только что"
  }

  const scrollHistoryLeft = () => {
    setHistoryScrollIndex(Math.max(0, historyScrollIndex - 1))
  }

  const scrollHistoryRight = () => {
    setHistoryScrollIndex(Math.min(recentDrops.length - 5, historyScrollIndex + 1))
  }

  return (
    <div
      className="flex-1 h-full overflow-y-auto overscroll-none"
      style={{
        WebkitOverflowScrolling: "touch",
        height: "calc(100vh - 140px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="space-y-4 pb-6">
        {/* История выпадений */}
        <div className="px-4 pt-4">
          <Card className="card-gradient p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Последние выпадения</span>
              </h3>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollHistoryLeft}
                  disabled={historyScrollIndex === 0}
                  className="w-8 h-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollHistoryRight}
                  disabled={historyScrollIndex >= recentDrops.length - 5}
                  className="w-8 h-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex space-x-2 overflow-hidden">
              {recentDrops.slice(historyScrollIndex, historyScrollIndex + 5).map((drop) => (
                <div
                  key={drop.id}
                  className="flex-shrink-0 w-32 p-2 rounded-lg bg-card/30 border border-border/30 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">{drop.playerName}</span>
                    <span className="text-xs">{getRarityIcon(drop.rarity)}</span>
                  </div>
                  <div className="text-xs font-medium text-foreground truncate">{drop.caseName}</div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">🪙</span>
                    <span className={`text-xs font-bold ${getRarityColor(drop.rarity)}`}>
                      {formatNumber(drop.reward.amount)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{getTimeAgo(drop.timestamp)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Заголовок */}
        <div className="text-center space-y-2 px-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center space-x-2">
            <Package className="w-6 h-6 text-primary" />
            <span>Магазин кейсов</span>
          </h1>
          <p className="text-sm text-muted-foreground">Откройте кейсы и получите награды!</p>
        </div>

        {/* Баланс */}
        <div className="px-4">
          <Card className="card-gradient p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-foreground">Ваш баланс:</span>
              </div>
              <span className="text-lg font-bold text-accent">{formatNumber(gameState.magnumCoins)} MC</span>
            </div>
          </Card>
        </div>

        {/* Карточки кейсов */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-3">
            {cases.map((caseItem, index) => (
              <Card
                key={caseItem.id}
                className={`case-card p-3 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 touch-optimized mobile-button relative overflow-hidden ${
                  caseItem.rarity === "legendary" || caseItem.rarity === "mythic" ? "case-glow" : ""
                } ${caseItem.specialOffer ? "border-2 border-green-400/50" : ""}`}
                onClick={() => openCase(caseItem)}
                style={{
                  minHeight: "200px",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {caseItem.specialOffer && (
                  <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold z-10">
                    АКЦИЯ!
                  </div>
                )}

                <div className="flex flex-col h-full space-y-2">
                  {/* Иконка кейса */}
                  <div className="relative mx-auto">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl border border-border/50">
                      {caseItem.image}
                    </div>
                    {caseItem.dailyLimit && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        3
                      </div>
                    )}
                  </div>

                  {/* Название и редкость */}
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-sm text-foreground leading-tight">{caseItem.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full bg-muted/20 ${getRarityColor(caseItem.rarity)} inline-block`}
                    >
                      {caseItem.rarity.toUpperCase()}
                    </span>
                  </div>

                  {/* Описание */}
                  <p className="text-xs text-muted-foreground text-center leading-tight flex-1">
                    {caseItem.description}
                  </p>

                  {/* Награды */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center">Награды:</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {caseItem.rewards.slice(0, 2).map((reward, idx) => (
                        <span key={idx} className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                          🪙 {formatNumber(reward.min)}-{formatNumber(reward.max)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Цена и кнопка */}
                  <div className="space-y-2 mt-auto">
                    <div className="text-center">
                      <div className="text-sm font-bold text-accent">{caseItem.price} MC</div>
                      {caseItem.dailyLimit && (
                        <div className="text-xs text-blue-400">Лимит: {caseItem.dailyLimit}/день</div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={gameState.magnumCoins < caseItem.price}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-xs py-1.5 h-auto"
                    >
                      {gameState.magnumCoins >= caseItem.price ? "Открыть" : "Недостаточно"}
                    </Button>
                  </div>

                  {/* Индикатор редкости */}
                  <div
                    className="h-0.5 rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-30"
                    style={{ color: caseItem.glowColor.replace("0.5", "1") }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Статистика */}
        <div className="px-4">
          <Card className="card-gradient p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>Статистика кейсов</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded bg-card/30">
                <div className="text-lg font-bold text-accent">0</div>
                <div className="text-xs text-muted-foreground">Открыто кейсов</div>
              </div>
              <div className="text-center p-2 rounded bg-card/30">
                <div className="text-lg font-bold text-yellow-400">0</div>
                <div className="text-xs text-muted-foreground">Лучший дроп</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
