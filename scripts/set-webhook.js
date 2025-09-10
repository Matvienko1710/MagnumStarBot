const { Telegraf } = require('telegraf');
require('dotenv').config();

async function setWebhook() {
    try {
        const bot = new Telegraf(process.env.BOT_TOKEN);
        const webhookUrl = `${process.env.WEBAPP_URL}/api/bot/webhook`;
        
        console.log('🔗 Устанавливаем webhook...');
        console.log('URL:', webhookUrl);
        
        await bot.telegram.setWebhook(webhookUrl);
        
        const webhookInfo = await bot.telegram.getWebhookInfo();
        console.log('✅ Webhook установлен успешно!');
        console.log('Информация о webhook:', webhookInfo);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка установки webhook:', error);
        process.exit(1);
    }
}

setWebhook();
