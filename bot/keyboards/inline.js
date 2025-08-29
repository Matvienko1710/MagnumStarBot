const { Markup } = require('telegraf');

const inlineKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.webApp('Открыть WebApp', process.env.WEBAPP_URL)],
    [Markup.button.callback('О боте', 'about')]
  ]);
};

module.exports = {
  inlineKeyboard
};