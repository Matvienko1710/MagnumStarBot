const { Markup } = require('telegraf');

const mainMenu = () => {
  return Markup.keyboard([
    ['🌐 WebApp', '📊 Статистика'],
    ['ℹ️ Информация', '⚙️ Настройки']
  ]).resize();
};

module.exports = {
  mainMenu
};