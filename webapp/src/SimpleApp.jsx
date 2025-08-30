import React, { useState, useEffect } from 'react'
import { TelegramProvider, useTelegram } from './context/TelegramContext'
import './App.css'

// Простой компонент без роутинга
function SimpleApp() {
  const [currentPage, setCurrentPage] = useState('home')
  const { user, balance, isLoading, error, updateBalance } = useTelegram()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка загрузки</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">🚀 Magnum Stars</h1>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Кликайте по кнопке и зарабатывайте Stars! Каждый клик приближает вас к богатству.
            </p>
            
            {/* Главная кнопка клика */}
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700 mb-2">Всего кликов: {balance.stars - 100}</div>
                <div className="text-sm text-gray-500">Каждый клик = +1 ⭐</div>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => updateBalance(1)}
                  className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  <span className="text-6xl font-bold text-white select-none">⭐</span>
                </button>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700 mb-1">Ваш баланс:</div>
                <div className="text-3xl font-bold text-yellow-600">{balance.stars} ⭐</div>
              </div>
            </div>
          </div>
        )
      
      case 'tasks':
        return (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">📋 Задания</h1>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Выполняйте задания и получайте дополнительные награды
            </p>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <p className="text-gray-500">Страница в разработке</p>
            </div>
          </div>
        )
      
      case 'earn':
        return (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">💰 Заработать ⭐️</h1>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Различные способы заработка Stars и Magnum Coins
            </p>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <p className="text-gray-500">Страница в разработке</p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Заголовок */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {user?.first_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">{user?.first_name || 'Пользователь'}</h1>
              <p className="text-sm text-gray-500">ID: {user?.id || 'N/A'}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-2 rounded-lg flex items-center space-x-2 shadow-md">
              <span className="text-lg">⭐</span>
              <div className="text-right">
                <div className="text-xs opacity-90">Stars</div>
                <div className="font-bold text-sm">{balance.stars}</div>
              </div>
            </div>
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
      
      {/* Основной контент */}
      <main className="pb-20 pt-4 px-4">
        {renderPage()}
      </main>
      
      {/* Нижняя навигация */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around px-2 py-3">
          <button
            onClick={() => setCurrentPage('home')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              currentPage === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs">Главная</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('tasks')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              currentPage === 'tasks' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="text-xl">📋</span>
            <span className="text-xs">Задания</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('earn')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              currentPage === 'earn' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="text-xl">💰</span>
            <span className="text-xs">Заработать</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

// Обертка с провайдером
function App() {
  return (
    <TelegramProvider>
      <SimpleApp />
    </TelegramProvider>
  )
}

export default App
