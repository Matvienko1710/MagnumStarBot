const { Markup } = require('telegraf');

const inlineKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.webApp('🌐 WebApp', process.env.WEBAPP_URL)],
    [Markup.button.callback('📊 Статистика', 'statistics')],
    [Markup.button.callback('ℹ️ Информация', 'about')],
    [Markup.button.callback('⚙️ Настройки', 'settings')]
  ]);
};

module.exports = {
  inlineKeyboard
};