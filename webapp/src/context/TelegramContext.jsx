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
      // Для разработки используем localStorage или заглушку
      const savedBalance = localStorage.getItem(`balance_${userId}`)
      if (savedBalance) {
        setBalance(JSON.parse(savedBalance))
      } else {
        // Устанавливаем начальный баланс
        const initialBalance = { stars: 100, coins: 500 }
        setBalance(initialBalance)
        localStorage.setItem(`balance_${userId}`, JSON.stringify(initialBalance))
      }
    } catch (error) {
      console.error('Ошибка загрузки баланса:', error)
      setError('Не удалось загрузить баланс')
      // Устанавливаем базовый баланс при ошибке
      setBalance({ stars: 100, coins: 500 })
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
      
      // Для разработки - логируем обновление
      console.log(`Баланс обновлен: +${amount} ⭐, новый баланс: ${newBalance.stars} ⭐`)
      
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
