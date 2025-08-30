const { Markup } = require('telegraf');
const logger = require('../utils/logger');

// Состояния пользователей для создания ключей
const userStates = new Map();

// Обработчик текстовых сообщений
async function infoHandler(ctx) {
    try {
        const userId = ctx.from.id;
        const text = ctx.message.text;
        
        logger.info('Получено текстовое сообщение', { userId, text: text.substring(0, 50) });
        
        // Проверяем состояние пользователя
        const userState = userStates.get(userId);
        
        if (userState && userState.state === 'waiting_for_key') {
            // Обработка активации ключа
            await handleKeyActivation(ctx, text);
            return;
        }
        
        if (userState && userState.state === 'creating_key') {
            // Обработка создания ключа
            await handleKeyCreation(ctx, text);
            return;
        }
        
        if (userState && userState.state === 'creating_title_key') {
            // Обработка создания ключа титула
            await handleTitleKeyCreation(ctx, text);
            return;
        }
        
        // Если нет специального состояния, отправляем сообщение о помощи
        await ctx.reply(
            '💡 Используйте кнопки меню для навигации по боту.\n\n' +
            '🔑 Для активации ключа нажмите "Активировать ключ"\n' +
            '💰 Для покупки майнеров нажмите "Майнеры"\n' +
            '👤 Для просмотра профиля нажмите "Профиль"',
            Markup.inlineKeyboard([
                [Markup.button.callback('🏠 Главное меню', 'main_menu')]
            ]).reply_markup
        );
        
    } catch (error) {
        logger.error('Ошибка в обработчике текстовых сообщений', error, { userId: ctx?.from?.id });
        throw error;
    }
}

// Обработка активации ключа
async function handleKeyActivation(ctx, text) {
    const userId = ctx.from.id;
    const key = text.trim();
    
    logger.info('Обработка активации ключа', { userId, key: key.substring(0, 10) });
    
    if (key.length === 0) {
        await ctx.reply(
            '❌ Ключ не может быть пустым!\n\n' +
            '🔑 Введите ключ для активации\n\n' +
            'Попробуйте еще раз или нажмите "Отмена"'
        );
        return;
    }
    
    // Здесь будет логика активации ключа
    // Пока что просто имитируем успешную активацию
    
    logger.info('Ключ успешно активирован', { userId, key: key.substring(0, 10) });
    
    // Очищаем состояние
    userStates.delete(userId);
    
    await ctx.reply(
        `✅ Ключ успешно активирован!\n\n` +
        `🎁 Получено:\n` +
        `├ ⭐ Stars: +50\n` +
        `└ 🪙 Magnum Coins: +25\n\n` +
        `🔑 Ключ: ${key.substring(0, 10)}...`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]).reply_markup
    );
}

// Обработка создания ключа
async function handleKeyCreation(ctx, text) {
    const userId = ctx.from.id;
    
    logger.info('Обработка создания ключа', { userId, step: userStates.get(userId)?.currentStep });
    
    const userState = userStates.get(userId);
    if (!userState) return;
    
    switch (userState.currentStep) {
        case 'description':
            // Ввод описания ключа
            const description = text.trim();
            if (description.length === 0) {
                await ctx.reply(
                    '❌ Описание не может быть пустым!\n\n' +
                    '💡 Введите описание ключа\n' +
                    'Пример: Тестовый ключ для новых пользователей\n\n' +
                    'Попробуйте еще раз или напишите "отмена" для отмены.'
                );
                return;
            }
            
            userState.data.description = description;
            
            // Создаем ключ
            try {
                logger.info('Создание обычного ключа', { userId, data: userState.data });
                
                // Здесь будет логика создания ключа
                const newKey = 'TEST_' + Math.random().toString(36).substring(2, 8).toUpperCase();
                
                logger.info('Обычный ключ успешно создан', { userId, key: newKey });
                
                // Очищаем состояние
                userStates.delete(userId);
                
                await ctx.reply(
                    `✅ Ключ успешно создан!\n\n` +
                    `🔑 Ключ: ${newKey}\n` +
                    `📝 Описание: ${userState.data.description}\n\n` +
                    `🎁 Награда:\n` +
                    `├ ⭐ Stars: ${userState.data.stars}\n` +
                    `└ 🪙 Magnum Coins: ${userState.data.coins}\n\n` +
                    `💰 Максимум активаций: ${userState.data.maxUses}`,
                    Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Отмена', 'admin_panel')]
                    ]).reply_markup
                );
            } catch (error) {
                logger.error('Ошибка создания обычного ключа', error, { userId, data: userState.data });
                
                // Очищаем состояние
                userStates.delete(userId);
                
                await ctx.reply(
                    `❌ Ошибка создания ключа!\n\n` +
                    `🔍 Причина: ${error.message}`,
                    Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Отмена', 'admin_panel')]
                    ]).reply_markup
                );
            }
            break;
            
        default:
            await ctx.reply('❌ Неизвестный шаг создания ключа');
            break;
    }
}

// Обработка создания ключа титула
async function handleTitleKeyCreation(ctx, text) {
    const userId = ctx.from.id;
    
    logger.info('Обработка создания ключа титула', { userId, step: userStates.get(userId)?.currentStep });
    
    const userState = userStates.get(userId);
    if (!userState) return;
    
    switch (userState.currentStep) {
        case 'description':
            // Ввод описания ключа
            const description = text.trim();
            if (description.length === 0) {
                await ctx.reply(
                    '❌ Описание не может быть пустым!\n\n' +
                    '💡 Введите описание ключа\n' +
                    'Пример: Тестовый ключ для новых пользователей\n\n' +
                    'Попробуйте еще раз или напишите "отмена" для отмены.'
                );
                return;
            }
            
            logger.info('Описание ключа введено', { userId, description });
            userState.data.description = description;
            
            // Создаем ключ титула
            try {
                logger.info('Создание ключа титула', { userId, data: userState.data });
                
                // Здесь будет логика создания ключа титула
                const newKey = 'TITLE_' + Math.random().toString(36).substring(2, 8).toUpperCase();
                
                logger.info('Ключ титула успешно создан', { userId, key: newKey, data: userState.data });
                
                // Очищаем состояние
                userStates.delete(userId);
                
                await ctx.reply(
                    `✅ Ключ титула успешно создан!\n\n` +
                    `🔑 Ключ: ${newKey}\n` +
                    `👑 Титул: ${userState.data.titleId}\n` +
                    `📝 Описание: ${userState.data.description}\n\n` +
                    `🎁 Награда:\n` +
                    `├ ⭐ Stars: ${userState.data.stars}\n` +
                    `├ 🪙 Magnum Coins: ${userState.data.coins}\n` +
                    `└ 👑 Титул: ${userState.data.titleId}\n\n` +
                    `💰 Максимум активаций: ${userState.data.maxUses}`,
                    Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Отмена', 'admin_panel')]
                    ]).reply_markup
                );
            } catch (error) {
                logger.error('Ошибка создания ключа титула', error, { userId, data: userState.data });
                
                // Очищаем состояние
                userStates.delete(userId);
                
                await ctx.reply(
                    `❌ Ошибка создания ключа титула!\n\n` +
                    `🔍 Причина: ${error.message}`,
                    Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Отмена', 'admin_panel')]
                    ]).reply_markup
                );
            }
            break;
            
        default:
            await ctx.reply('❌ Неизвестный шаг создания ключа титула');
            break;
    }
}

module.exports = infoHandler;