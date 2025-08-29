const { Markup } = require('telegraf');

const inlineKeyboard = (isAdmin = false) => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  console.log('WEBAPP_URL:', process.env.WEBAPP_URL);
  console.log('Using webappUrl:', webappUrl);
  
  const buttons = [
    [Markup.button.callback('👤 Профиль', 'profile')]
  ];
  
  // Добавляем кнопки админа только если пользователь является администратором
  if (isAdmin) {
    buttons.push([Markup.button.webApp('🌐 WebApp', webappUrl)]);
    buttons.push([Markup.button.callback('🔧 Админ панель', 'admin_panel')]);
  }
  
  return Markup.inlineKeyboard(buttons);
};

const inlineKeyboardWithBack = (isAdmin = false) => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  const buttons = [
    [Markup.button.callback('👤 Профиль', 'profile')]
  ];
  
  // Добавляем кнопки админа только если пользователь является администратором
  if (isAdmin) {
    buttons.push([Markup.button.webApp('🌐 WebApp', webappUrl)]);
    buttons.push([Markup.button.callback('🔧 Админ панель', 'admin_panel')]);
  }
  
  // Добавляем кнопки навигации в конце
  buttons.push([Markup.button.callback('🔙 Назад', 'back')]);
  buttons.push([Markup.button.callback('🏠 В главное меню', 'main_menu')]);
  
  return Markup.inlineKeyboard(buttons);
};

module.exports = {
  inlineKeyboard,
  inlineKeyboardWithBack
};