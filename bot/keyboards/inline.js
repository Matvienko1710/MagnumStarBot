const { Markup } = require('telegraf');

const inlineKeyboard = (isAdmin = false) => {
  const webappUrl = process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com';
  
  console.log('WEBAPP_URL:', process.env.WEBAPP_URL);
  console.log('Using webappUrl:', webappUrl);
  
  const buttons = [
    [Markup.button.callback('👤 Профиль', 'profile')],
    [Markup.button.callback('🔑 Активировать ключ', 'activate_key')],
    [Markup.button.callback('⛏️ Майнеры', 'miners')],
    [Markup.button.callback('💰 Вывести звезды', 'withdraw_stars')]
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
    [Markup.button.callback('💰 Вывести звезды', 'withdraw_stars')]
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
    [Markup.button.callback('⛏️ Новичок (100 🪙)', 'buy_novice_miner')],
    [Markup.button.callback('⛏️ Путь к звездам (100 ⭐)', 'buy_star_path_miner')],
    [Markup.button.callback('🔙 Назад к майнерам', 'miners')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

// Клавиатура для профиля
const profileKeyboard = (isAdmin = false) => {
  const buttons = [
    [Markup.button.callback('👑 Титулы', 'titles')],
    [Markup.button.callback('👥 Рефералы', 'referrals')],
    [Markup.button.callback('📊 Статистика', 'profile_stats')],
    [Markup.button.callback('🔙 Назад', 'back')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ];
  
  return Markup.inlineKeyboard(buttons);
};

// Клавиатура для титулов
const titlesKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('👑 Сменить титул', 'change_title')],
    [Markup.button.callback('📊 Мои титулы', 'my_titles')],
    [Markup.button.callback('🔙 Назад к профилю', 'profile')],
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

// Клавиатура для вывода звезд
const withdrawKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💰 Вывести все звезды', 'withdraw_all_stars')],
    [Markup.button.callback('💳 Указать сумму', 'withdraw_custom_amount')],
    [Markup.button.callback('📊 История выводов', 'withdraw_history')],
    [Markup.button.callback('🔙 Назад', 'back')],
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
    [Markup.button.callback('🔙 Назад к профилю', 'profile')],
    [Markup.button.callback('🏠 В главное меню', 'main_menu')]
  ]);
};

module.exports = {
  inlineKeyboard,
  inlineKeyboardWithBack,
  adminPanelKeyboard,
  createKeyKeyboard,
  minersKeyboard,
  buyMinerKeyboard,
  titlesKeyboard,
  changeTitleKeyboard,
  profileKeyboard,
  withdrawKeyboard,
  referralsKeyboard
};