"use client"

import type React from "react"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Coins, Zap, ArrowUp, User, X, Settings, Trophy, BarChart3, Award } from "lucide-react"

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
  boosts: { type: string; multiplier: number; remaining: number; icon: string; name: string }[]
  autoClicker: { level: number; clicksPerSecond: number }
  statistics: { totalEarned: number; totalSpent: number; currentClickStreak: number; maxClickStreak: number }
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
  multiplier: number
}

interface HomePageProps {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  upgrades: Upgrade[]
  setUpgrades: React.Dispatch<React.SetStateAction<Upgrade[]>>
  showProfile: boolean
  setShowProfile: (show: boolean) => void
  showUpgrades: boolean
  setShowUpgrades: (show: boolean) => void
}

export default function HomePage({
  gameState,
  setGameState,
  upgrades,
  setUpgrades,
  showProfile,
  setShowProfile,
  showUpgrades,
  setShowUpgrades,
}: HomePageProps) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      if (gameState.energy <= 0) return

      event.preventDefault()

      // Тактильная обратная связь
      if ("vibrate" in navigator) {
        navigator.vibrate(50)
      }

      // Вычисляем множители от бустов
      let clickMultiplier = 1
      gameState.boosts.forEach((boost) => {
        if (boost.type === "click_multiplier") {
          clickMultiplier *= boost.multiplier
        }
      })

      const coinsEarned = Math.floor(gameState.clickPower * clickMultiplier)

      setGameState((prev) => ({
        ...prev,
        magnumCoins: prev.magnumCoins + coinsEarned,
        energy: prev.energy - 1,
        clickAnimating: true,
        energyAnimating: true,
        totalClicks: prev.totalClicks + 1,
        experience: prev.experience + 1,
        level: Math.floor((prev.experience + 1) / prev.experienceToNext) + 1,
        statistics: {
          ...prev.statistics,
          totalEarned: prev.statistics.totalEarned + coinsEarned,
          currentClickStreak: prev.statistics.currentClickStreak + 1,
          maxClickStreak: Math.max(prev.statistics.maxClickStreak, prev.statistics.currentClickStreak + 1),
        },
      }))

      setTimeout(() => {
        setGameState((prev) => ({ ...prev, clickAnimating: false, energyAnimating: false }))
      }, 300)
    },
    [gameState.energy, gameState.clickPower, gameState.boosts, setGameState],
  )

  const buyUpgrade = useCallback(
    (upgradeId: string) => {
      const upgrade = upgrades.find((u) => u.id === upgradeId)
      if (!upgrade || gameState.magnumCoins < upgrade.price || upgrade.level >= upgrade.maxLevel) return

      setGameState((prev) => {
        const newState = { ...prev, magnumCoins: prev.magnumCoins - upgrade.price }

        // Применяем эффекты улучшений
        switch (upgradeId) {
          case "click_power":
            newState.clickPower = prev.clickPower + 1
            break
          case "energy_capacity":
            newState.maxEnergy = prev.maxEnergy + 10
            break
          case "energy_regen":
            // Эффект применяется в логике восстановления энергии
            break
          case "auto_clicker":
            newState.autoClicker = {
              ...prev.autoClicker,
              level: prev.autoClicker.level + 1,
              clicksPerSecond: prev.autoClicker.clicksPerSecond + 1,
            }
            break
        }

        newState.statistics.totalSpent += upgrade.price
        return newState
      })

      setUpgrades((prev) =>
        prev.map((u) =>
          u.id === upgradeId ? { ...u, level: u.level + 1, price: Math.floor(u.price * u.multiplier) } : u,
        ),
      )
    },
    [gameState.magnumCoins, upgrades, setGameState, setUpgrades],
  )

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + "B"
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M"
    if (num >= 1000) return (num / 1000).toFixed(2) + "K"
    return num.toFixed(num < 1 ? 4 : 0)
  }

  const activateBoost = (boostType: string) => {
    // Логика активации бустов будет добавлена позже
  }

  return (
    <div className="flex-1 flex flex-col mobile-safe-area mobile-compact space-y-4 relative touch-optimized no-overscroll">
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground">Уровень {gameState.level}</span>
            <Button
              variant="ghost"
              size="sm"
              className="mobile-button w-10 h-10 rounded-full bg-card/50 backdrop-blur-md border border-border/50 hover:bg-accent/20 touch-optimized ml-auto"
              onClick={() => setShowProfile(true)}
            >
              <User className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>
        <Progress
          value={((gameState.experience % gameState.experienceToNext) / gameState.experienceToNext) * 100}
          className="h-2 bg-muted"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Опыт: {gameState.experience % gameState.experienceToNext}/{gameState.experienceToNext}
        </p>
      </div>

      {gameState.boosts.length > 0 && (
        <div className="px-4">
          <div className="flex space-x-2 overflow-x-auto">
            {gameState.boosts.map((boost, index) => (
              <div key={index} className="flex-shrink-0 bg-accent/20 rounded-lg px-3 py-2 border border-accent/30">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{boost.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-foreground">{boost.name}</p>
                    <p className="text-xs text-muted-foreground">{Math.ceil(boost.remaining)}с</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="card-gradient p-4 text-center hw-accelerated">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Coins className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-bold text-foreground">Magnum Coins</h3>
            </div>
            <p className="text-2xl font-bold text-accent">{formatNumber(gameState.magnumCoins)}</p>
          </Card>

          <Card className="card-gradient p-4 text-center hw-accelerated">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-yellow-400 text-lg">⭐</span>
              <h3 className="text-sm font-bold text-foreground">Звезды</h3>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{formatNumber(gameState.stars)}</p>
          </Card>
        </div>
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

          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-card/80 backdrop-blur-md rounded-lg px-3 py-1 border border-border/50">
              <p className="text-xs font-medium text-foreground">+{gameState.clickPower} за клик</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-20">
        <Button
          onClick={() => setShowUpgrades(true)}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary h-14 text-lg font-bold"
        >
          <ArrowUp className="w-6 h-6 mr-2" />
          Улучшения
        </Button>
      </div>

      {/* Upgrades Modal */}
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
          </Card>
        </div>
      )}

      {/* Profile Modal */}
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
                <span className="font-bold text-accent">{formatNumber(gameState.statistics.totalEarned)}</span>
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
}
