'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface User {
  magnumCoins: number
  stars: number
  energy: number
  maxEnergy: number
  totalClicks: number
  level: number
  telegramId?: number
  username?: string
  firstName?: string
  lastName?: string
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [clicking, setClicking] = useState(false)
  const [rewardPopup, setRewardPopup] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 })

  // Get Telegram WebApp data
  useEffect(() => {
    const initTelegram = () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        tg.ready()
        tg.expand()
        
        const userData = tg.initDataUnsafe?.user
        if (userData) {
          fetchUser(userData.id)
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

  const fetchUser = async (telegramId: number) => {
    try {
      const response = await fetch(`/api/users?telegramId=${telegramId}`)
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = async () => {
    if (!user || user.energy <= 0 || clicking) return

    setClicking(true)
    
    try {
      const response = await fetch('/api/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: user.telegramId || 123456789 }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
        setRewardPopup({ show: true, amount: 1 })
        setTimeout(() => setRewardPopup({ show: false, amount: 0 }), 1200)
      }
    } catch (error) {
      console.error('Error clicking:', error)
    } finally {
      setClicking(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toFixed(4)
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="card-gradient max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Ошибка</CardTitle>
            <CardDescription className="text-center">
              Не удалось загрузить данные пользователя
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Reward Popup */}
      {rewardPopup.show && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="reward-popup text-4xl font-bold text-accent">
            +{rewardPopup.amount} 🪙
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            🎮 Magnum Clicker
          </h1>
          <p className="text-muted-foreground">
            Зарабатывайте криптовалюту кликами!
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Magnum Coins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {formatNumber(user.magnumCoins)}
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Stars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-energy">
                {formatNumber(user.stars)} ⭐
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Energy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {user.energy}/{user.maxEnergy}
              </div>
              <Progress 
                value={(user.energy / user.maxEnergy) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {user.level}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.totalClicks} кликов
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Click Area */}
        <div className="text-center mb-8">
          <Card className="case-card max-w-md mx-auto">
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="text-6xl mb-4">🪙</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Кликайте для заработка!
                </h2>
                <p className="text-muted-foreground">
                  Каждый клик = 1 Magnum Coin + 0.0001 Star
                </p>
              </div>
              
              <Button
                onClick={handleClick}
                disabled={user.energy <= 0 || clicking}
                className={`w-full h-16 text-xl font-bold ${
                  user.energy <= 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'pulse-glow hover:scale-105 transition-transform'
                }`}
                variant="default"
              >
                {clicking ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Кликаем...
                  </div>
                ) : user.energy <= 0 ? (
                  'Нет энергии!'
                ) : (
                  '🪙 КЛИК!'
                )}
              </Button>
              
              {user.energy <= 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Энергия восстановится через некоторое время
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cases Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-foreground mb-6">Кейсы</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Card className="case-card coming-soon-float">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">📦</div>
                <h4 className="font-bold text-foreground mb-2">Базовый кейс</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Стоимость: 100 MC
                </p>
                <Button disabled className="w-full">
                  Скоро
                </Button>
              </CardContent>
            </Card>

            <Card className="case-card coming-soon-float" style={{ animationDelay: '1s' }}>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">💎</div>
                <h4 className="font-bold text-foreground mb-2">Премиум кейс</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Стоимость: 500 MC
                </p>
                <Button disabled className="w-full">
                  Скоро
                </Button>
              </CardContent>
            </Card>

            <Card className="case-card coming-soon-float" style={{ animationDelay: '2s' }}>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">👑</div>
                <h4 className="font-bold text-foreground mb-2">Легендарный кейс</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Стоимость: 1000 MC
                </p>
                <Button disabled className="w-full">
                  Скоро
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
