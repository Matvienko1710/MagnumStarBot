const https = require('https');

// URL вашего Vercel проекта
const WEBAPP_URL = 'https://magnmstartbot1.vercel.app';

// Замените YOUR_BOT_TOKEN на реальный токен
const BOT_TOKEN = 'YOUR_BOT_TOKEN';

if (BOT_TOKEN === 'YOUR_BOT_TOKEN') {
  console.error('❌ Ошибка: Замените YOUR_BOT_TOKEN на реальный токен бота');
  process.exit(1);
}

async function setWebhook() {
  try {
    const webhookUrl = `${WEBAPP_URL}/api/bot/webhook`;
    
    console.log('🔗 Устанавливаем webhook...');
    console.log('URL:', webhookUrl);
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl
      })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Webhook установлен успешно!');
      console.log('Результат:', result);
    } else {
      console.error('❌ Ошибка установки webhook:', result);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

setWebhook();
