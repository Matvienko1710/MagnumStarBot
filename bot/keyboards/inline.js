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
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Назад', 'back')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

module.exports = {
  inlineKeyboard,
  inlineKeyboardWithBack
};