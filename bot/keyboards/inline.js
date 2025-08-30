const { Markup } = require('telegraf');

const inlineKeyboard = (isAdmin = false) => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  console.log('WEBAPP_URL:', process.env.WEBAPP_URL);
  console.log('Using webappUrl:', webappUrl);
  
  const buttons = [
    [Markup.button.callback('👤 Профиль', 'profile')],
    [Markup.button.callback('🔑 Активировать ключ', 'activate_key')],
    [Markup.button.callback('⛏️ Майнеры', 'miners')],
    [Markup.button.callback('👑 Титулы', 'titles')]
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
    [Markup.button.callback('🔑 Активировать ключ', 'activate_key')],
    [Markup.button.callback('⛏️ Майнеры', 'miners')],
    [Markup.button.callback('👑 Титулы', 'titles')]
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
    [Markup.button.callback('👑 Создать ключ титула', 'create_title_key')],
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

// Клавиатура для майнеров
const minersKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⛏️ Купить майнер', 'buy_miner')],
    [Markup.button.callback('📊 Мои майнеры', 'my_miners')],
    [Markup.button.callback('💰 Забрать награды', 'collect_rewards')],
    [Markup.button.callback('🔙 Назад', 'back')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

// Клавиатура для покупки майнеров
const buyMinerKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⛏️ Базовый майнер (100 Stars)', 'buy_basic_miner')],
    [Markup.button.callback('⛏️ Продвинутый майнер (500 Stars)', 'buy_advanced_miner')],
    [Markup.button.callback('⛏️ Профессиональный майнер (1000 Stars)', 'buy_pro_miner')],
    [Markup.button.callback('🔙 Назад к майнерам', 'miners')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

// Клавиатура для титулов
const titlesKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('👑 Сменить титул', 'change_title')],
    [Markup.button.callback('📊 Мои титулы', 'my_titles')],
    [Markup.button.callback('🔙 Назад', 'back')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

// Клавиатура для смены титула
const changeTitleKeyboard = (unlockedTitles, currentTitleId) => {
  const buttons = unlockedTitles.map(title => {
    const isCurrent = title.id === currentTitleId;
    const buttonText = `${isCurrent ? '✅ ' : ''}${title.color} ${title.name}`;
    return [Markup.button.callback(buttonText, `set_title_${title.id}`)];
  });
  
  buttons.push([Markup.button.callback('🔙 Назад к титулам', 'titles')]);
  buttons.push([Markup.button.callback('🏠 В главное меню', 'main_menu')]);
  
  return Markup.inlineKeyboard(buttons);
};

module.exports = {
  inlineKeyboard,
  inlineKeyboardWithBack,
  adminPanelKeyboard,
  createKeyKeyboard,
  minersKeyboard,
  buyMinerKeyboard,
  titlesKeyboard,
  changeTitleKeyboard
};