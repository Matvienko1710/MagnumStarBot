const { Telegraf } = require('telegraf');
require('dotenv').config();

async function deleteWebhook() {
    try {
        const bot = new Telegraf(process.env.BOT_TOKEN);
        
        console.log('🗑️ Удаляем webhook...');
        
        await bot.telegram.deleteWebhook();
        
        const webhookInfo = await bot.telegram.getWebhookInfo();
        console.log('✅ Webhook удален успешно!');
        console.log('Информация о webhook:', webhookInfo);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка удаления webhook:', error);
        process.exit(1);
    }
}

deleteWebhook();
