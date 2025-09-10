"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Coins, TrendingUp } from "lucide-react"

import type { WalletPageProps } from "@/lib/types"

export default function WalletPage({ gameState }: WalletPageProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M"
    if (num >= 1000) return (num / 1000).toFixed(2) + "K"
    return num.toFixed(num < 1 ? 4 : 0)
  }

  return (
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
              <div className="text-xs text-muted-foreground">MC ↔ TON</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10">
            <TrendingUp className="w-6 h-6 text-primary" />
            <div className="text-left">
              <div className="font-medium text-foreground">Вывод средств</div>
              <div className="text-xs text-muted-foreground">На внешние кошельки</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/10 border border-border/50">
          <div className="text-sm text-muted-foreground mb-2">Текущий баланс:</div>
          <div className="flex justify-between">
            <span className="text-foreground">Magnum Coins:</span>
            <span className="font-bold text-accent">{formatNumber(gameState.magnumCoins)}</span>
          </div>
        </div>

        <Button className="w-full bg-gradient-to-r from-primary to-accent">Уведомить о запуске</Button>
      </Card>
    </div>
  )
}
