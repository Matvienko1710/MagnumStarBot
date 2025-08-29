const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN);

// Импорт обработчиков
const startHandler = require('./handlers/start');
const infoHandler = require('./handlers/info');
const callbackHandler = require('./handlers/callback');

// Регистрация обработчиков
startHandler(bot);
infoHandler(bot);
callbackHandler(bot);

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`Ошибка для ${ctx.updateType}`, err);
});

module.exports = bot;