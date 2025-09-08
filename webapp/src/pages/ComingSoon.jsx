import React from 'react';
import { motion } from 'framer-motion';

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Иконка */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mx-auto w-32 h-32 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl"
          >
            <span className="text-6xl">🚀</span>
          </motion.div>

          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-4xl font-bold text-white">
              Скоро появится!
            </h1>
            <p className="text-xl text-blue-300 font-medium">
              Эта функция в разработке
            </p>
          </motion.div>

          {/* Описание */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="space-y-4"
          >
            <p className="text-gray-300 leading-relaxed">
              Мы усердно работаем над этой функцией, чтобы сделать её ещё лучше для вас.
              Следите за обновлениями!
            </p>

            {/* Прогресс бар */}
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Прогресс разработки</div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ delay: 1.2, duration: 1.5 }}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                />
              </div>
              <div className="text-xs text-gray-500">75% завершено</div>
            </div>
          </motion.div>

          {/* Функции */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="grid grid-cols-2 gap-4 mt-8"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm text-white font-medium">Качество</div>
              <div className="text-xs text-gray-400">Тестируем</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm text-white font-medium">Производительность</div>
              <div className="text-xs text-gray-400">Оптимизируем</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-sm text-white font-medium">Безопасность</div>
              <div className="text-xs text-gray-400">Усиливаем</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-2xl mb-2">🎨</div>
              <div className="text-sm text-white font-medium">Дизайн</div>
              <div className="text-xs text-gray-400">Улучшаем</div>
            </div>
          </motion.div>

          {/* Сообщение */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
          >
            <p className="text-blue-300 text-sm">
              💡 Хотите быть в курсе всех обновлений? Следите за нашими новостями в канале!
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ComingSoon;
