const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error('Please set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_URL environment variables');
  process.exit(1);
}

const webhookUrl = `${WEBHOOK_URL}/api/telegram`;

const data = JSON.stringify({
  url: webhookUrl,
  allowed_updates: ['message', 'callback_query']
});

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${BOT_TOKEN}/setWebhook`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const result = JSON.parse(responseData);
    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`Webhook URL: ${webhookUrl}`);
    } else {
      console.error('❌ Failed to set webhook:', result.description);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error setting webhook:', error.message);
});

req.write(data);
req.end();
