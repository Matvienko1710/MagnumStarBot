const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error('❌ TELEGRAM_WEBHOOK_URL не найден в переменных окружения');
  process.exit(1);
}

const webhookUrl = `${WEBHOOK_URL}`;
const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;

const postData = JSON.stringify({
  url: webhookUrl,
  allowed_updates: ['message', 'callback_query']
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔧 Настройка webhook для Telegram бота...');
console.log(`📡 Webhook URL: ${webhookUrl}`);
console.log(`🤖 Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);

const req = https.request(telegramApiUrl, options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.ok) {
        console.log('✅ Webhook успешно настроен!');
        console.log('📋 Детали:', JSON.stringify(response.result, null, 2));
      } else {
        console.error('❌ Ошибка настройки webhook:', response.description);
      }
    } catch (error) {
      console.error('❌ Ошибка парсинга ответа:', error);
      console.log('📄 Ответ сервера:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Ошибка запроса:', error);
});

req.write(postData);
req.end();
