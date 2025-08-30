import React, { useState } from 'react'
import { useTelegram } from '../context/TelegramContext'

const MainButton = () => {
  const { updateBalance, balance } = useTelegram()
  const [isAnimating, setIsAnimating] = useState(false)
  const [clickCount, setClickCount] = useState(0)

  const handleClick = async () => {
    setIsAnimating(true)
    setClickCount(prev => prev + 1)
    
    // Обновляем баланс
    await updateBalance(1)
    
    // Анимация завершается через 300ms
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      {/* Статистика кликов */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-700 mb-2">
          Всего кликов: {clickCount}
        </div>
        <div className="text-sm text-gray-500">
          Каждый клик = +1 ⭐
        </div>
      </div>

      {/* Главная кнопка */}
      <div className="relative">
        <button
          onClick={handleClick}
          disabled={isAnimating}
          className={`
            relative w-48 h-48 rounded-full 
            bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600
            hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700
            active:from-yellow-600 active:via-yellow-700 active:to-yellow-800
            transform transition-all duration-200 ease-out
            shadow-2xl hover:shadow-3xl
            ${isAnimating ? 'scale-95' : 'hover:scale-105'}
            disabled:cursor-not-allowed
            flex items-center justify-center
          `}
        >
          {/* Внутренний круг */}
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center">
            <span className="text-6xl font-bold text-white select-none">
              ⭐
            </span>
          </div>

          {/* Анимация клика */}
          {isAnimating && (
            <div className="absolute inset-0 rounded-full bg-yellow-300 animate-ping opacity-75"></div>
          )}
        </button>

        {/* Эффект частиц при клике */}
        {isAnimating && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-60px)`,
                  animationDelay: `${i * 50}ms`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Текущий баланс */}
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-700 mb-1">
          Ваш баланс:
        </div>
        <div className="text-3xl font-bold text-yellow-600">
          {balance.stars} ⭐
        </div>
      </div>

      {/* Подсказка */}
      <div className="text-center text-sm text-gray-500 max-w-xs">
        💡 Кликайте по кнопке, чтобы заработать Stars! 
        Каждый клик увеличивает ваш баланс на 1 звезду.
      </div>
    </div>
  )
}

export default MainButton
