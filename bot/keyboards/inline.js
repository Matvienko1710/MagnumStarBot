const { Markup } = require('telegraf');

const inlineKeyboard = (isAdmin = false) => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  console.log('WEBAPP_URL:', process.env.WEBAPP_URL);
  console.log('Using webappUrl:', webappUrl);
  
  const buttons = [
    [Markup.button.callback('�� Профиль', 'profile')],
    [Markup.button.callback('🔑 Активировать ключ', 'activate_key')]
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
    [Markup.button.callback('👤 Профиль', 'profile')],
    [Markup.button.callback('🔑 Активировать ключ', 'activate_key')]
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

// Клавиатура для админ панели
const adminPanelKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔑 Создать ключ', 'create_key')],
    [Markup.button.callback('📊 Статистика ключей', 'keys_stats')],
    [Markup.button.callback('🔙 Назад', 'back')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

// Клавиатура для создания ключа
const createKeyKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Отмена', 'admin_panel')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

module.exports = {
  inlineKeyboard,
  inlineKeyboardWithBack,
  adminPanelKeyboard,
  createKeyKeyboard
};