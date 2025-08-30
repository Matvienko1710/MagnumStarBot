import React from 'react'

const EarnPage = () => {
  return (
    <div className="min-h-screen">
      {/* Заголовок страницы */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          💰 Заработать ⭐️
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Различные способы заработка Stars и Magnum Coins
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
            Здесь будут доступны различные способы заработка: просмотр рекламы, 
            выполнение заданий, реферальные программы и многое другое.
          </p>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🎯 Планируемые способы заработка:
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Просмотр рекламных видео</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Переходы по реферальным ссылкам</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Участие в турнирах</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>Ежедневные бонусы</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Временные карточки заработка */}
      <div className="mt-8 px-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">📺 Смотреть рекламу</h3>
                <p className="text-sm opacity-90">Посмотрите 30-секундное видео</p>
                <div className="mt-3 text-2xl font-bold">+5 ⭐</div>
              </div>
              <div className="text-6xl">📺</div>
            </div>
            <button className="mt-4 w-full bg-white text-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors">
              Смотреть рекламу
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">👥 Пригласить друга</h3>
                <p className="text-sm opacity-90">Поделитесь реферальной ссылкой</p>
                <div className="mt-3 text-2xl font-bold">+50 ⭐</div>
              </div>
              <div className="text-6xl">👥</div>
            </div>
            <button className="mt-4 w-full bg-white text-green-600 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors">
              Поделиться ссылкой
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">🎮 Играть в игры</h3>
                <p className="text-sm opacity-90">Завершите мини-игру</p>
                <div className="mt-3 text-2xl font-bold">+10 ⭐</div>
              </div>
              <div className="text-6xl">🎮</div>
            </div>
            <button className="mt-4 w-full bg-white text-purple-600 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors">
              Играть
            </button>
          </div>
        </div>
      </div>

      {/* Статистика заработка */}
      <div className="mt-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            📊 Статистика заработка
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Реклам просмотрено</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Друзей приглашено</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">Игр сыграно</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-sm text-gray-600">Бонусов получено</div>
            </div>
          </div>
        </div>
      </div>

      {/* Информация о лимитах */}
      <div className="mt-8 px-4 mb-8">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
            ⚠️ Важная информация
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">•</span>
              <span>Рекламу можно смотреть до 10 раз в день</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">•</span>
              <span>Реферальные бонусы начисляются за каждого приглашенного друга</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">•</span>
              <span>Мини-игры доступны каждые 4 часа</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EarnPage
