const { Markup } = require('telegraf');

const inlineKeyboard = () => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  console.log('WEBAPP_URL:', process.env.WEBAPP_URL);
  console.log('Using webappUrl:', webappUrl);
  
  return Markup.inlineKeyboard([
    [Markup.button.webApp('🌐 WebApp', webappUrl)],
    [Markup.button.callback('📊 Статистика', 'statistics')],
    [Markup.button.callback('ℹ️ Информация', 'about')],
    [Markup.button.callback('⚙️ Настройки', 'settings')]
  ]);
};

const inlineKeyboardWithBack = () => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  return Markup.inlineKeyboard([
    [Markup.button.webApp('🌐 WebApp', webappUrl)],
    [Markup.button.callback('📊 Статистика', 'statistics')],
    [Markup.button.callback('ℹ️ Информация', 'about')],
    [Markup.button.callback('⚙️ Настройки', 'settings')],
    [Markup.button.callback('🔙 Главное меню', 'main_menu')]
  ]);
};

module.exports = {
  inlineKeyboard,
  inlineKeyboardWithBack
};