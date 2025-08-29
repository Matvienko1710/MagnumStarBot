const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bot = require('./bot');

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
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  
  // Запуск бота
  bot.launch()
    .then(() => {
      console.log('Бот успешно запущен');
    })
    .catch((err) => {
      console.error('Ошибка при запуске бота:', err);
    });
});

// Корректное завершение работы
process.once('SIGINT', () => {
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
});