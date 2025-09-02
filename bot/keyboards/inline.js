const { Markup } = require('telegraf');

const inlineKeyboard = (isAdmin = false) => {
  // WebApp временно отключен
// const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
// console.log('WEBAPP_URL:', process.env.WEBAPP_URL);
// console.log('Using webappUrl:', webappUrl);
  
  const buttons = [
    [Markup.button.callback('👤 Профиль', 'profile')],
    [Markup.button.callback('🎁 Ежедневный бонус', 'daily_bonus')],
    [Markup.button.callback('🔑 Активировать ключ', 'activate_key')],
    [Markup.button.callback('🌟 Вывести звезды', 'withdraw_stars')],
    [Markup.button.callback('👥 Рефералы', 'referrals')]
  ];
  
  // Добавляем кнопки админа только если пользователь является администратором
  // WebApp временно отключен
  if (isAdmin) {
    // buttons.push([Markup.button.webApp('🌐 WebApp', webappUrl)]);
    buttons.push([Markup.button.callback('🔧 Админ панель', 'admin_panel')]);
  }
  
  return Markup.inlineKeyboard(buttons);
};

const inlineKeyboardWithBack = (isAdmin = false) => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  const buttons = [
    [Markup.button.callback('👤 Профиль', 'profile')],
    [Markup.button.callback('🔑 Активировать ключ', 'activate_key')],
    [Markup.button.callback('🌟 Вывести звезды', 'withdraw_stars')]
  ];
  
  // Добавляем кнопки админа только если пользователь является администратором
  // WebApp временно отключен
  if (isAdmin) {
    // buttons.push([Markup.button.webApp('🌐 WebApp', webappUrl)]);
    buttons.push([Markup.button.callback('🔧 Админ панель', 'admin_panel')]);
  }
  
  // Добавляем кнопку навигации в конце
  buttons.push([Markup.button.callback('🏠 В главное меню', 'main_menu')]);
  
  return Markup.inlineKeyboard(buttons);
};

// Клавиатура для админ панели
const adminPanelKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔑 Создать ключ', 'create_key')],
    [Markup.button.callback('⛏️ Создать ключ майнера', 'create_miner_key')],
    [Markup.button.callback('👑 Создать ключ титула', 'create_title_key')],
    [Markup.button.callback('📊 Статистика ключей', 'keys_stats')],
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

// Клавиатура для создания ключа титула
const createTitleKeyKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Отмена', 'admin_panel')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

// Клавиатура для создания ключа майнера
const createMinerKeyKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⛏️ Новичок (100 🪙)', 'miner_key_novice')],
    [Markup.button.callback('⭐ Путь к звездам (100 ⭐)', 'miner_key_star_path')],
    [Markup.button.callback('🔙 Отмена', 'admin_panel')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

// Клавиатура для майнеров
const minersKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⛏️ Купить майнер', 'buy_miner')],
    [Markup.button.callback('📊 Мои майнеры', 'my_miners')],
    [Markup.button.callback('💎 Забрать награды', 'collect_rewards')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

// Клавиатура для покупки майнеров (постраничная)
const buyMinerKeyboard = (page = 1) => {
  const { getMinerByPage, getTotalMinerPages } = require('../utils/miners');
  const miner = getMinerByPage(page);
  
  if (!miner) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🏠 В главное меню', 'main_menu')]
    ]);
  }
  
  const buttons = [
    [Markup.button.callback(`⛏️ ${miner.name} (${miner.price} ${miner.priceSymbol})`, `buy_${miner.id}_miner`)]
  ];
  
  // Кнопки навигации
  if (miner.totalPages > 1) {
    const navButtons = [];
    
    if (page > 1) {
      navButtons.push(Markup.button.callback('◀️ Предыдущий', `miner_page_${page - 1}`));
    }
    
    if (page < miner.totalPages) {
      navButtons.push(Markup.button.callback('Следующий ▶️', `miner_page_${page + 1}`));
    }
    
    if (navButtons.length > 0) {
      buttons.push(navButtons);
    }
  }
  
  // Кнопки навигации
  buttons.push([Markup.button.callback('🏠 В главное меню', 'main_menu')]);
  
  return Markup.inlineKeyboard(buttons);
};

// Клавиатура для профиля
const profileKeyboard = (isAdmin = false) => {
  const buttons = [
    [Markup.button.callback('👥 Рефералы', 'referrals')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ];

  return Markup.inlineKeyboard(buttons);
};

// Функции титулов удалены - функционал убран из бота

// Клавиатура для вывода звезд
const withdrawKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🌟 Вывести все звезды', 'withdraw_all_stars')],
    [Markup.button.callback('💳 Указать сумму', 'withdraw_custom_amount')],
    [Markup.button.callback('📊 История выводов', 'withdraw_history')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

// Клавиатура для рефералов
const referralsKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔗 Мой реферальный код', 'my_referral_code')],
    [Markup.button.callback('👥 Мои рефералы', 'my_referrals')],
    [Markup.button.callback('🏆 Топ рефералов', 'top_referrers')],
    [Markup.button.callback('📈 Уровни и награды', 'referral_levels')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

module.exports = {
  inlineKeyboard,
  inlineKeyboardWithBack,
  adminPanelKeyboard,
  createKeyKeyboard,
  createTitleKeyKeyboard,
  createMinerKeyKeyboard,
  minersKeyboard,
  buyMinerKeyboard,
  profileKeyboard,
  withdrawKeyboard,
  referralsKeyboard
};