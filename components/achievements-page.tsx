"use client"

import { Card } from "@/components/ui/card"
import { AchievementBadge } from "@/components/ui/achievement-badge"
import { Trophy, Target, Zap, Coins, Star, Award, Crown, Sparkles } from "lucide-react"

import type { GameState } from "@/lib/types"

interface AchievementsPageProps {
  gameState: GameState
}

export default function AchievementsPage({ gameState }: AchievementsPageProps) {
  const achievements = [
    {
      id: "first_click",
      title: "Первый клик",
      description: "Сделайте свой первый клик",
      icon: <Target className="w-5 h-5" />,
      isUnlocked: gameState.totalClicks >= 1,
      progress: gameState.totalClicks,
      maxProgress: 1,
    },
    {
      id: "click_master",
      title: "Мастер кликов",
      description: "Сделайте 1000 кликов",
      icon: <Zap className="w-5 h-5" />,
      isUnlocked: gameState.totalClicks >= 1000,
      progress: gameState.totalClicks,
      maxProgress: 1000,
    },
    {
      id: "coin_collector",
      title: "Собиратель монет",
      description: "Заработайте 10,000 Magnum Coins",
      icon: <Coins className="w-5 h-5" />,
      isUnlocked: gameState.statistics.totalEarned >= 10000,
      progress: gameState.statistics.totalEarned,
      maxProgress: 10000,
    },
    {
      id: "level_up",
      title: "Повышение уровня",
      description: "Достигните 10 уровня",
      icon: <Star className="w-5 h-5" />,
      isUnlocked: gameState.level >= 10,
      progress: gameState.level,
      maxProgress: 10,
    },
    {
      id: "case_opener",
      title: "Открыватель кейсов",
      description: "Откройте 50 кейсов",
      icon: <Award className="w-5 h-5" />,
      isUnlocked: gameState.statistics.casesOpened >= 50,
      progress: gameState.statistics.casesOpened,
      maxProgress: 50,
    },
    {
      id: "rare_hunter",
      title: "Охотник за редкостями",
      description: "Найдите 10 редких предметов",
      icon: <Sparkles className="w-5 h-5" />,
      isUnlocked: gameState.statistics.rareItemsFound >= 10,
      progress: gameState.statistics.rareItemsFound,
      maxProgress: 10,
    },
    {
      id: "streak_master",
      title: "Мастер серий",
      description: "Сделайте серию из 100 кликов",
      icon: <Crown className="w-5 h-5" />,
      isUnlocked: gameState.statistics.maxClickStreak >= 100,
      progress: gameState.statistics.maxClickStreak,
      maxProgress: 100,
    },
  ]

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const totalCount = achievements.length

  return (
    <div className="flex-1 mobile-safe-area mobile-compact space-y-4 overflow-y-auto mobile-scroll no-overscroll pb-4">
      <div className="px-4 pt-4">
        <Card className="card-gradient p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-bold text-foreground">Достижения</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Разблокировано: {unlockedCount}/{totalCount}
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </Card>
      </div>

      <div className="px-4 space-y-3">
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            title={achievement.title}
            description={achievement.description}
            icon={achievement.icon}
            isUnlocked={achievement.isUnlocked}
            progress={achievement.progress}
            maxProgress={achievement.maxProgress}
          />
        ))}
      </div>

      <div className="px-4 pb-4">
        <Card className="card-gradient p-4 text-center">
          <h3 className="text-sm font-bold text-foreground mb-2">
            Больше достижений скоро!
          </h3>
          <p className="text-xs text-muted-foreground">
            Мы работаем над добавлением новых интересных достижений
          </p>
        </Card>
      </div>
    </div>
  )
}
