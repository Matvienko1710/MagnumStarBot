import React from 'react'

const TasksPage = () => {
  return (
    <div className="min-h-screen">
      {/* Заголовок страницы */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          📋 Задания
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Выполняйте задания и получайте дополнительные награды
        </p>
      </div>

      {/* Заглушка */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Страница в разработке
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Здесь будут доступны различные задания для заработка Stars и Magnum Coins. 
            Система заданий находится в разработке.
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🎯 Что планируется:
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Ежедневные задания</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Еженедельные вызовы</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Специальные события</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>Реферальные программы</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Временные карточки */}
      <div className="mt-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-bold mb-2">Ежедневный вход</h3>
            <p className="text-sm opacity-90">Войдите в игру 7 дней подряд</p>
            <div className="mt-3 text-2xl font-bold">+50 ⭐</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-bold mb-2">100 кликов</h3>
            <p className="text-sm opacity-90">Сделайте 100 кликов за день</p>
            <div className="mt-3 text-2xl font-bold">+25 ⭐</div>
          </div>
        </div>
      </div>

      {/* Информация о прогрессе */}
      <div className="mt-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            📊 Ваш прогресс
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Ежедневный вход</span>
                <span className="text-sm text-gray-500">0/7 дней</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Клики сегодня</span>
                <span className="text-sm text-gray-500">0/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TasksPage
