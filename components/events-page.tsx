"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Target, Clock } from "lucide-react"

import type { EventsPageProps } from "@/lib/types"

export default function EventsPage({ gameState }: EventsPageProps) {
  return (
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
}
