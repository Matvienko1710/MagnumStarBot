const { Markup } = require('telegraf');

const inlineKeyboard = () => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  console.log('WEBAPP_URL:', process.env.WEBAPP_URL);
  console.log('Using webappUrl:', webappUrl);
  
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 Статистика', 'statistics')],
    [Markup.button.callback('💎 Баланс', 'balance')],
    [Markup.button.callback('👥 Рефералы', 'referrals')],
    [Markup.button.callback('🎯 Задания', 'tasks')],
    [Markup.button.callback('⚙️ Настройки', 'settings')],
    [Markup.button.webApp('🌐 WebApp', webappUrl)]
  ]);
};

const inlineKeyboardWithBack = () => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 Статистика', 'statistics')],
    [Markup.button.callback('💎 Баланс', 'balance')],
    [Markup.button.callback('👥 Рефералы', 'referrals')],
    [Markup.button.callback('🎯 Задания', 'tasks')],
    [Markup.button.callback('⚙️ Настройки', 'settings')],
    [Markup.button.webApp('🌐 WebApp', webappUrl)],
    [Markup.button.callback('🔙 Главное меню', 'main_menu')]
  ]);
};

module.exports = {
  inlineKeyboard,
  inlineKeyboardWithBack
};