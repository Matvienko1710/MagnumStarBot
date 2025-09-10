const { Telegraf } = require('telegraf');
const express = require('express');

const app = express();

// Middleware
app.use(express.json());

// Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN);

// Webhook URL
const webhookUrl = `${process.env.WEBAPP_URL}/api/bot/webhook`;

// Импортируем handlers
const startHandler = require('../bot/handlers/start');
const callbackHandler = require('../bot/handlers/callback');
const infoHandler = require('../bot/handlers/info');

// Middleware
const chatFilter = require('../bot/middleware/chatFilter');
const errorMiddleware = require('../bot/middleware/errorMiddleware');

// Применяем middleware
bot.use(chatFilter);
bot.use(errorMiddleware);

// Регистрируем handlers
startHandler.register(bot);
callbackHandler.register(bot);
infoHandler.register(bot);

// Webhook endpoint
app.post('/webhook', (req, res) => {
  try {
    bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// Установка webhook
app.get('/set-webhook', async (req, res) => {
  try {
    await bot.telegram.setWebhook(webhookUrl);
    res.json({ success: true, webhookUrl });
  } catch (error) {
    console.error('Set webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Удаление webhook
app.get('/delete-webhook', async (req, res) => {
  try {
    await bot.telegram.deleteWebhook();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    webhookUrl 
  });
});

module.exports = app;
