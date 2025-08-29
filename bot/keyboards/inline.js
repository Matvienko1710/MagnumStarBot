const { Markup } = require('telegraf');

const inlineKeyboard = () => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  console.log('WEBAPP_URL:', process.env.WEBAPP_URL);
  console.log('Using webappUrl:', webappUrl);
  
  return Markup.inlineKeyboard([
    [Markup.button.callback('👤 Профиль', 'profile')],
    [Markup.button.webApp('🌐 WebApp', webappUrl)]
  ]);
};

const inlineKeyboardWithBack = () => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  return Markup.inlineKeyboard([
    [Markup.button.callback('👤 Профиль', 'profile')],
    [Markup.button.webApp('🌐 WebApp', webappUrl)],
    [Markup.button.callback('🔙 Главное меню', 'main_menu')]
  ]);
};

module.exports = {
  inlineKeyboard,
  inlineKeyboardWithBack
};