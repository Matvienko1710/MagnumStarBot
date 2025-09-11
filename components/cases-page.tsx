"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CaseCard } from "@/components/ui/case-card"
import { Package, Coins, Sparkles, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react"

import type { CasesPageProps } from "@/lib/types"

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
    <div className="flex-1 mobile-safe-area mobile-compact space-y-4 overflow-y-auto mobile-scroll no-overscroll pb-4">
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

      <div className="text-center space-y-2 px-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center space-x-2">
          <Package className="w-6 h-6 text-primary" />
          <span>Магазин кейсов</span>
        </h1>
        <p className="text-sm text-muted-foreground">Откройте кейсы и получите награды!</p>
      </div>

      <Card className="card-gradient p-4 hw-accelerated mx-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-foreground">Ваш баланс:</span>
          </div>
          <span className="text-lg font-bold text-accent">{formatNumber(gameState.magnumCoins)} MC</span>
        </div>
      </Card>

      <div className="space-y-3 px-4">
        {cases.map((caseItem, index) => (
          <CaseCard
            key={caseItem.id}
            name={caseItem.name}
            price={caseItem.price}
            description={caseItem.description}
            image={caseItem.image}
            isAvailable={gameState.magnumCoins >= caseItem.price}
            onOpen={() => openCase(caseItem)}
            className={`${
              caseItem.rarity === "legendary" || caseItem.rarity === "mythic" ? "case-glow" : ""
            } ${caseItem.specialOffer ? "border-2 border-green-400/50" : ""}`}
          />
        ))}
      </div>

      <div className="px-4 pb-4">
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
  )
}
