import React from 'react'
import { useTelegram } from '../context/TelegramContext'

const Header = () => {
  const { balance, isLoading, user } = useTelegram()

  if (isLoading) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Информация о пользователе */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">
              {user?.first_name || 'Пользователь'}
            </h1>
            <p className="text-sm text-gray-500">
              ID: {user?.id || 'N/A'}
            </p>
          </div>
        </div>

        {/* Баланс */}
        <div className="flex space-x-3">
          {/* Stars */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-2 rounded-lg flex items-center space-x-2 shadow-md">
            <span className="text-lg">⭐</span>
            <div className="text-right">
              <div className="text-xs opacity-90">Stars</div>
              <div className="font-bold text-sm">{balance.stars}</div>
            </div>
          </div>

          {/* Magnum Coins */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg flex items-center space-x-2 shadow-md">
            <span className="text-lg">🪙</span>
            <div className="text-right">
              <div className="text-xs opacity-90">Coins</div>
              <div className="font-bold text-sm">{balance.coins}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
