import React from 'react'
import MainButton from '../components/MainButton'

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Заголовок страницы */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🚀 Magnum Stars
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Кликайте по кнопке и зарабатывайте Stars! 
          Каждый клик приближает вас к богатству.
        </p>
      </div>

      {/* Главная кнопка */}
      <MainButton />

      {/* Дополнительная информация */}
      <div className="mt-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            💎 Как это работает?
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Кликайте по кнопке</h3>
                <p className="text-sm text-gray-600">
                  Нажимайте на большую желтую кнопку, чтобы заработать Stars
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Получайте награды</h3>
                <p className="text-sm text-gray-600">
                  Каждый клик даёт вам +1 Star в ваш баланс
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Выводите Stars</h3>
                <p className="text-sm text-gray-600">
                  Накопите Stars и выводите их через бота
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="mt-8 px-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">⭐</div>
            <div className="text-sm opacity-90">Stars</div>
            <div className="text-lg font-bold">Бесконечно</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">🪙</div>
            <div className="text-sm opacity-90">Coins</div>
            <div className="text-lg font-bold">Много</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
