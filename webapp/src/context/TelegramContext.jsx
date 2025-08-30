import React, { createContext, useContext, useState, useEffect } from 'react'

const TelegramContext = createContext()

export const useTelegram = () => {
  const context = useContext(TelegramContext)
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider')
  }
  return context
}

export const TelegramProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [balance, setBalance] = useState({ stars: 0, coins: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Инициализация Telegram WebApp
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      
      // Получаем данные пользователя
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user)
        // Загружаем баланс пользователя
        loadUserBalance(tg.initDataUnsafe.user.id)
      } else {
        // Для разработки - тестовые данные
        setUser({
          id: 123456789,
          first_name: 'Тестовый',
          last_name: 'Пользователь',
          username: 'test_user'
        })
        setBalance({ stars: 100, coins: 500 })
        setIsLoading(false)
      }
    } else {
      // Для разработки без Telegram
      setUser({
        id: 123456789,
        first_name: 'Тестовый',
        last_name: 'Пользователь',
        username: 'test_user'
      })
      setBalance({ stars: 100, coins: 500 })
      setIsLoading(false)
    }
  }, [])

  // Загрузка баланса пользователя
  const loadUserBalance = async (userId) => {
    try {
      setIsLoading(true)
      // Здесь будет API запрос к боту для получения баланса
      // Пока используем заглушку
      const response = await fetch(`/api/user/balance?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setBalance(data)
      } else {
        // Если API недоступен, используем данные из localStorage или заглушку
        const savedBalance = localStorage.getItem(`balance_${userId}`)
        if (savedBalance) {
          setBalance(JSON.parse(savedBalance))
        } else {
          setBalance({ stars: 0, coins: 0 })
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки баланса:', error)
      setError('Не удалось загрузить баланс')
    } finally {
      setIsLoading(false)
    }
  }

  // Обновление баланса при клике
  const updateBalance = async (amount = 1) => {
    try {
      const newBalance = { ...balance, stars: balance.stars + amount }
      setBalance(newBalance)
      
      // Сохраняем в localStorage
      if (user?.id) {
        localStorage.setItem(`balance_${user.id}`, JSON.stringify(newBalance))
      }
      
      // Отправляем обновление в бот (если доступно)
      if (window.Telegram?.WebApp) {
        try {
          await fetch('/api/user/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              amount: amount
            })
          })
        } catch (error) {
          console.log('Бот API недоступен, баланс обновлен локально')
        }
      }
    } catch (error) {
      console.error('Ошибка обновления баланса:', error)
      setError('Не удалось обновить баланс')
    }
  }

  // Синхронизация с ботом
  const syncWithBot = async () => {
    if (user?.id) {
      await loadUserBalance(user.id)
    }
  }

  const value = {
    user,
    balance,
    isLoading,
    error,
    updateBalance,
    syncWithBot,
    loadUserBalance
  }

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  )
}
