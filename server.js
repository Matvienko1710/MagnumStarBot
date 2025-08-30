const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { bot, launchBot } = require('./bot');

// Загрузка переменных окружения
dotenv.config();

// Инициализация Express приложения
const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы
app.use(express.static(path.join(__dirname, 'webapp')));
app.use(express.json());

// Маршруты
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'webapp', 'index.html'));
});

// API для взаимодействия с ботом
app.post('/api/webhook', (req, res) => {
  const data = req.body;
  console.log('Получены данные от WebApp:', data);
  res.json({ success: true });
});

// Запуск сервера
const server = app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  
  // Запуск бота
  launchBot();
});

// Корректное завершение работы
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 Получен сигнал ${signal}. Начинаю graceful shutdown...`);
  
  try {
    // Останавливаем бота
    await bot.stop(signal);
    console.log('✅ Бот успешно остановлен');
    
    // Останавливаем сервер
    server.close(() => {
      console.log('✅ HTTP сервер успешно остановлен');
      process.exit(0);
    });
    
    // Таймаут для принудительного завершения
    setTimeout(() => {
      console.error('❌ Принудительное завершение из-за таймаута');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Ошибка при graceful shutdown:', error);
    process.exit(1);
  }
};

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Обработка необработанных ошибок процесса
process.on('uncaughtException', (error) => {
  console.error('❌ Необработанная ошибка процесса:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанное отклонение промиса:', reason);
  gracefulShutdown('unhandledRejection');
});