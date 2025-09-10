"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Gift, Crown, Star } from "lucide-react"

import type { CaseItem, CaseOpeningScreenProps } from "@/lib/types"

export default function CaseOpeningScreen({
  selectedCase,
  rouletteItems,
  rouletteSpinning,
  rouletteOffset,
  roulettePhase,
  caseResult,
  onClose,
  spinRoulette,
}: CaseOpeningScreenProps) {
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

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/10">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад
        </Button>
        <h2 className="text-xl font-bold text-white">{selectedCase?.name}</h2>
        <div className="w-16"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
        <div className="relative w-full max-w-lg">
          {/* Phase Indicator */}
          <div className="text-center mb-4">
            <div
              className={`text-sm font-bold ${
                roulettePhase === "ready"
                  ? "text-green-400"
                  : roulettePhase === "spinning"
                    ? "text-yellow-400"
                    : roulettePhase === "slowing"
                      ? "text-orange-400"
                      : "text-red-400"
              }`}
            >
              {roulettePhase === "ready" && "Готов к запуску"}
              {roulettePhase === "spinning" && "Разгон..."}
              {roulettePhase === "slowing" && "Замедление..."}
              {roulettePhase === "stopped" && "Остановка!"}
            </div>
          </div>

          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg"></div>
          </div>

          {/* Roulette Container */}
          <div className="relative h-32 bg-black/40 rounded-xl overflow-hidden border-4 border-yellow-400/50 shadow-2xl">
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="flex h-full will-change-transform"
                style={{
                  transform: `translateX(${rouletteOffset}px)`,
                  transitionDuration:
                    roulettePhase === "ready"
                      ? "0ms"
                      : roulettePhase === "spinning"
                        ? "2000ms"
                        : roulettePhase === "slowing"
                          ? "3000ms"
                          : "3000ms",
                  transitionTimingFunction:
                    roulettePhase === "spinning"
                      ? "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                      : roulettePhase === "slowing"
                        ? "cubic-bezier(0.165, 0.84, 0.44, 1)"
                        : "cubic-bezier(0.23, 1, 0.32, 1)",
                  width: `${rouletteItems.length * 100}px`,
                }}
              >
                {rouletteItems.map((item, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-25 h-full flex flex-col items-center justify-center border-r border-white/20 relative ${
                      item.rarity === "mythic"
                        ? "bg-gradient-to-b from-pink-500/30 to-pink-600/30"
                        : item.rarity === "legendary"
                          ? "bg-gradient-to-b from-yellow-500/30 to-yellow-600/30"
                          : item.rarity === "epic"
                            ? "bg-gradient-to-b from-purple-500/30 to-purple-600/30"
                            : item.rarity === "rare"
                              ? "bg-gradient-to-b from-blue-500/30 to-blue-600/30"
                              : "bg-gradient-to-b from-gray-500/30 to-gray-600/30"
                    }`}
                    style={{ width: "100px", minWidth: "100px" }}
                  >
                    {item.isWinning && (
                      <div className="absolute inset-0 bg-yellow-400/20 border-2 border-yellow-400 animate-pulse"></div>
                    )}
                    <div className="text-3xl mb-1">🪙</div>
                    <div className={`text-xs font-bold ${getRarityColor(item.rarity)}`}>
                      {formatNumber(item.amount)}
                    </div>
                    <div className="text-xs opacity-60">{getRarityIcon(item.rarity)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-yellow-400 z-10 shadow-lg"></div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  roulettePhase === "ready"
                    ? "w-0 bg-green-400"
                    : roulettePhase === "spinning"
                      ? "w-1/3 bg-yellow-400"
                      : roulettePhase === "slowing"
                        ? "w-2/3 bg-orange-400"
                        : "w-full bg-red-400"
                }`}
              ></div>
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <Button
          onClick={spinRoulette}
          disabled={rouletteSpinning || roulettePhase !== "ready"}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-bold text-xl px-12 py-6 rounded-2xl disabled:opacity-50 shadow-2xl transform transition-transform hover:scale-105"
        >
          {rouletteSpinning ? "Крутим..." : "🎰 Открыть кейс!"}
        </Button>

        {selectedCase && (
          <Card className="bg-black/50 border-white/30 p-6 max-w-md w-full backdrop-blur-md">
            <h3 className="text-white font-bold mb-4 text-center flex items-center justify-center space-x-2">
              <Gift className="w-5 h-5" />
              <span>Возможные награды</span>
            </h3>
            <div className="space-y-3">
              {selectedCase.rewards.map((reward, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🪙</span>
                    <div>
                      <div className="text-white font-medium">
                        {formatNumber(reward.min)} - {formatNumber(reward.max)} MC
                      </div>
                      <div className="text-xs text-gray-300">Magnum Coins</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold text-lg">{reward.chance}%</div>
                    <div className="text-xs text-gray-400">шанс</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30">
              <div className="text-center text-white text-sm">
                <Crown className="w-4 h-4 inline mr-1" />
                Чем выше редкость, тем больше награда!
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Result Modal */}
      {caseResult && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center">
          <Card className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-400/50 p-8 text-center space-y-6 max-w-sm mx-4 shadow-2xl">
            <div className="text-8xl animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold text-white">Поздравляем!</h2>
            <div className="space-y-2">
              <div className="text-6xl">🪙</div>
              <div className={`text-4xl font-bold ${getRarityColor(caseResult[0].rarity)}`}>
                +{formatNumber(caseResult[0].amount)} MC
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-white/80">Редкость:</span>
                <span className={`font-bold ${getRarityColor(caseResult[0].rarity)}`}>
                  {caseResult[0].rarity.toUpperCase()}
                </span>
                <span>{getRarityIcon(caseResult[0].rarity)}</span>
              </div>
            </div>
            <p className="text-white/80">Монеты добавлены на ваш баланс!</p>

            <div className="flex space-x-2 justify-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-6 h-6 text-yellow-400 animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
