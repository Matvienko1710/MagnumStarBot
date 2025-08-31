const { Markup } = require('telegraf');
const logger = require('../utils/logger');

// Обработчик текстовых сообщений
async function infoHandler(ctx) {
    try {
        const userId = ctx.from.id;
        const text = ctx.message.text;
        
        logger.info('Получено текстовое сообщение', { userId, text: text.substring(0, 50) });
        
        // Импортируем userStates из callback.js
        const { userStates } = require('./callback');
        
        // Проверяем состояние пользователя
        const userState = userStates.get(userId);
        
        if (userState && userState.state === 'waiting_for_key') {
            // Обработка активации ключа
            await handleKeyActivation(ctx, text);
            return;
        }
        
        if (userState && userState.state === 'creating_key') {
            // Обработка создания ключа
            const { handleKeyCreation } = require('./callback');
            await handleKeyCreation(ctx, text);
            return;
        }
        
        if (userState && userState.state === 'creating_title_key') {
            // Обработка создания ключа титула
            const { handleTitleKeyCreation } = require('./callback');
            await handleTitleKeyCreation(ctx, text);
            return;
        }
        
        if (userState && userState.state === 'waiting_for_withdrawal_amount') {
            // Обработка создания заявки на вывод
            await handleWithdrawalAmount(ctx, text);
            return;
        }

        if (userState && userState.state === 'creating_miner_key') {
            // Обработка создания ключа майнера
            const { handleMinerKeyCreation } = require('./callback');
            await handleMinerKeyCreation(ctx, text);
            return;
        }
        
        // Если нет специального состояния, отправляем сообщение о помощи
        await ctx.reply(
            '💡 Используйте кнопки меню для навигации по боту.\n\n' +
            '🔑 Для активации ключа нажмите "Активировать ключ"\n' +
            '⚒️ Для покупки майнеров нажмите "Майнеры"\n' +
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
    
    // Проверяем формат ключа (12 цифр)
    const { validateKeyFormat, activateKey } = require('../utils/keys');
    
    if (!validateKeyFormat(key)) {
        await ctx.reply(
            '❌ Неверный формат ключа!\n\n' +
            '🔑 Ключ должен содержать ровно 12 цифр\n\n' +
            'Попробуйте еще раз или нажмите "Отмена"'
        );
        return;
    }
    
    try {
        // Активируем ключ через dataManager
        const dataManager = require('../utils/dataManager');
        const result = await dataManager.activateKey(key, userId);
        
        if (result.success) {
            logger.info('Ключ успешно активирован', { userId, key: key.substring(0, 10) });
            
            // Очищаем состояние
            const { userStates } = require('./callback');
            userStates.delete(userId);
            
            await ctx.reply(
                `✅ **Ключ успешно активирован!**\n\n` +
                `🎁 Получено:\n` +
                `${result.rewardText.join('\n')}\n\n` +
                `🔑 Ключ: ${key.substring(0, 6)}...`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('🏠 Главное меню', 'main_menu')]
                ]).reply_markup
            );
        } else {
            await ctx.reply(
                `❌ **Ошибка активации ключа**\n\n` +
                `🚫 ${result.message || 'Неизвестная ошибка'}\n\n` +
                `🔑 Попробуйте другой ключ или обратитесь к администратору`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔑 Попробовать еще раз', 'activate_key')],
                    [Markup.button.callback('🏠 Главное меню', 'main_menu')]
                ]).reply_markup
            );
        }
        
    } catch (error) {
        logger.error('Ошибка при активации ключа', error, { userId, key: key.substring(0, 10) });
        
        await ctx.reply(
            `❌ **Ошибка при активации ключа**\n\n` +
            `🚫 ${error.message || 'Неизвестная ошибка'}\n\n` +
            `🔑 Попробуйте другой ключ или обратитесь к администратору`,
            Markup.inlineKeyboard([
                [Markup.button.callback('🔑 Попробовать еще раз', 'activate_key')],
                [Markup.button.callback('🏠 Главное меню', 'main_menu')]
            ]).reply_markup
        );
    }
}

// Обработка создания ключа
async function handleKeyCreation(ctx, text) {
    const userId = ctx.from.id;
    
    logger.info('Обработка создания ключа', { userId, step: userStates.get(userId)?.currentStep });
    
    const userState = userStates.get(userId);
    if (!userState) return;
    
    switch (userState.currentStep) {
        case 'reward_amount':
            // Ввод количества награды
            await handleKeyRewardAmount(ctx, text);
            break;
            
        case 'max_uses':
            // Ввод максимального количества активаций
            await handleKeyMaxUses(ctx, text);
            break;
            
        default:
            await ctx.reply(
                '❌ Неизвестный шаг создания ключа\n\n' +
                '🔙 Вернитесь в админ панель и попробуйте снова',
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Админ панель', 'admin_panel')]
                ]).reply_markup
            );
            break;
    }
}

// Обработка ввода количества награды для ключа
async function handleKeyRewardAmount(ctx, text) {
    const userId = ctx.from.id;
    
    logger.info('Ввод количества награды для ключа', { userId, amount: text });
    
    const userState = userStates.get(userId);
    if (!userState) return;
    
    const numAmount = parseInt(text);
    if (isNaN(numAmount) || numAmount <= 0) {
        await ctx.reply(
            '❌ Неверное количество!\n\n' +
            '�� Введите положительное число\n\n' +
            'Попробуйте еще раз'
        );
        return;
    }
    
    // Сохраняем количество награды
    if (userState.data.rewardType === 'stars') {
        userState.data.stars = numAmount;
    } else {
        userState.data.coins = numAmount;
    }
    
    userState.currentStep = 'max_uses';
    
    const rewardTypeText = userState.data.rewardType === 'stars' ? '⭐ Stars' : '🪙 Magnum Coins';
    
    const message = `🔑 **Создание ключа**\n\n` +
        `🎯 Тип награды: ${rewardTypeText}\n` +
        `💰 Количество: ${numAmount}\n\n` +
        `🔄 Введите максимальное количество активаций ключа:\n\n` +
        `💡 Пример: 1, 5, 10`;
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Назад', 'create_key')],
        [Markup.button.callback('🔙 Отмена', 'admin_panel')]
    ]);
    
    await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
    });
}

// Обработка ввода максимального количества активаций для ключа
async function handleKeyMaxUses(ctx, text) {
    const userId = ctx.from.id;
    
    logger.info('Ввод максимального количества активаций для ключа', { userId, maxUses: text });
    
    const userState = userStates.get(userId);
    if (!userState) return;
    
    const numMaxUses = parseInt(text);
    if (isNaN(numMaxUses) || numMaxUses <= 0) {
        await ctx.reply(
            '❌ Неверное количество активаций!\n\n' +
            '🔄 Введите положительное число\n\n' +
            'Попробуйте еще раз'
        );
        return;
    }
    
    userState.data.maxUses = numMaxUses;
    
    // Создаем ключ
    const { createKey } = require('../utils/keys');
    
    let reward;
    if (userState.data.rewardType === 'stars') {
        reward = { stars: userState.data.stars, coins: 0 };
    } else {
        reward = { stars: 0, coins: userState.data.coins };
    }
    
    const keyData = createKey(userState.data.rewardType, reward, numMaxUses);

    // Сохраняем ключ в базе данных
    const dataManager = require('../utils/dataManager');
    const dbKeyData = {
        key: keyData.key,
        type: userState.data.rewardType,
        reward: reward,
        maxUses: numMaxUses,
        createdBy: userId
    };

    await dataManager.createKey(dbKeyData);

    // Очищаем состояние
    userStates.delete(userId);

    const rewardTypeText = userState.data.rewardType === 'stars' ? '⭐ Stars' : '🪙 Magnum Coins';
    const rewardAmount = userState.data.rewardType === 'stars' ? userState.data.stars : userState.data.coins;

    const successMessage = `✅ **Ключ успешно создан!**\n\n` +
        `🔑 Ключ: \`${keyData.key}\`\n` +
        `🎯 Тип: ${rewardTypeText}\n` +
        `💰 Награда: ${rewardAmount} ${rewardTypeText}\n` +
        `🔄 Максимум активаций: ${numMaxUses}\n\n` +
        `📝 Скопируйте ключ и отправьте пользователям`;

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔑 Создать еще ключ', 'create_key')],
        [Markup.button.callback('🔙 Админ панель', 'admin_panel')]
    ]);

    await ctx.reply(successMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
    });

    // Отправляем уведомление в чат
    const chatMessage = `🎉 **Новый ключ создан!**\n\n` +
        `🔑 Ключ: \`${keyData.key}\`\n` +
        `🎯 Тип награды: ${rewardTypeText}\n` +
        `💰 Размер награды: ${rewardAmount} ${rewardTypeText}\n` +
        `🔄 Максимум активаций: ${numMaxUses}\n` +
        `👤 Создал: @${ctx.from.username || 'админ'}\n\n` +
        `💡 Пользователи могут активировать этот ключ в боте!`;

    const { sendChannelNotification } = require('../middleware/chatFilter');
    await sendChannelNotification(ctx, chatMessage);
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
                
                // Создаем ключ титула
                const newKey = 'TITLE_' + Math.random().toString(36).substring(2, 8).toUpperCase();

                // Сохраняем ключ в базе данных
                const titleKeyData = {
                    key: newKey,
                    type: 'title',
                    reward: {
                        stars: userState.data.stars,
                        coins: userState.data.coins,
                        title: userState.data.titleId
                    },
                    maxUses: userState.data.maxUses,
                    createdBy: userId,
                    description: userState.data.description
                };

                await dataManager.createKey(titleKeyData);

                logger.info('Ключ титула успешно создан и сохранен', { userId, key: newKey, data: userState.data });

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

                // Отправляем уведомление в чат
                const chatMessage = `🎉 **Новый ключ титула создан!**\n\n` +
                    `🔑 Ключ: \`${newKey}\`\n` +
                    `👑 Титул: ${userState.data.titleId}\n` +
                    `📝 Описание: ${userState.data.description}\n` +
                    `🎁 Награда:\n` +
                    `├ ⭐ Stars: ${userState.data.stars}\n` +
                    `├ 🪙 Magnum Coins: ${userState.data.coins}\n` +
                    `└ 👑 Титул: ${userState.data.titleId}\n` +
                    `🔄 Максимум активаций: ${userState.data.maxUses}\n` +
                    `👤 Создал: @${ctx.from.username || 'админ'}\n\n` +
                    `💡 Пользователи могут активировать этот ключ в боте!`;

                const { sendChannelNotification } = require('../middleware/chatFilter');
                await sendChannelNotification(ctx, chatMessage);
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

// Обработка ввода суммы для заявки на вывод
async function handleWithdrawalAmount(ctx, text) {
    const userId = ctx.from.id;
    const amount = parseInt(text.trim());
    
    logger.info('Обработка ввода суммы для заявки на вывод', { userId, amount });
    
    if (isNaN(amount) || amount <= 0) {
        await ctx.reply(
            '❌ **Неверная сумма!**\n\n' +
            '💰 Введите корректное число больше 0\n' +
            '💡 Пример: 100 (для вывода 100 ⭐ Stars)\n\n' +
            'Попробуйте еще раз или нажмите "Отмена"'
        );
        return;
    }
    
    if (amount < 50) {
        await ctx.reply(
            '❌ **Сумма слишком мала!**\n\n' +
            '💰 Минимальная сумма для вывода: 50 ⭐ Stars\n' +
            '💡 Введите сумму 50 или больше\n\n' +
            'Попробуйте еще раз или нажмите "Отмена"'
        );
        return;
    }
    
    try {
        // Импортируем dataManager
        const dataManager = require('../utils/dataManager');
        
        // Создаем заявку на вывод
        const result = await dataManager.createWithdrawalRequest(userId, amount);
        
        if (result.success) {
            logger.info('Заявка на вывод создана успешно', { userId, amount, requestId: result.requestId });
            
            // Очищаем состояние
            const { userStates } = require('./callback');
            userStates.delete(userId);
            
            const successMessage = `✅ **Заявка на вывод создана!**\n\n` +
                `📋 **Детали заявки:**\n` +
                `├ 🆔 ID: \`${result.requestId}\`\n` +
                `├ 💰 Сумма: ${amount} ⭐ Stars\n` +
                `├ 📅 Дата: ${new Date().toLocaleDateString('ru-RU')}\n` +
                `└ 📊 Статус: ⏳ Ожидает одобрения\n\n` +
                `⏰ **Время обработки:** 24-48 часов\n` +
                `💡 **Что дальше:** Ожидайте уведомления об одобрении или отклонении заявки`;
            
            const successKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('📋 Мои заявки', 'my_withdrawals')],
                [Markup.button.callback('💳 Создать еще заявку', 'create_withdrawal')],
                [Markup.button.callback('🏠 Главное меню', 'main_menu')]
            ]);
            
            await ctx.reply(successMessage, {
                parse_mode: 'Markdown',
                reply_markup: successKeyboard.reply_markup
            });
            
            // Отправляем заявку в канал для админов
            await sendWithdrawalToChannel(ctx, result.request, ctx.from);
            
        } else {
            await ctx.reply(
                `❌ **Ошибка создания заявки!**\n\n` +
                `🚫 ${result.message}\n\n` +
                `💡 Попробуйте другую сумму или обратитесь к администратору`
            );
        }
        
    } catch (error) {
        logger.error('Ошибка создания заявки на вывод', error, { userId, amount });
        
        // Очищаем состояние
        const { userStates } = require('./callback');
        userStates.delete(userId);
        
        await ctx.reply(
            `❌ **Ошибка создания заявки!**\n\n` +
            `🚫 Не удалось создать заявку на вывод\n` +
            `🔧 Попробуйте позже или обратитесь к администратору\n\n` +
            `💬 Ошибка: ${error.message}`,
            Markup.inlineKeyboard([
                [Markup.button.callback('🔄 Попробовать снова', 'create_withdrawal')],
                [Markup.button.callback('🏠 Главное меню', 'main_menu')]
            ]).reply_markup
        );
    }
}

// Отправка заявки на вывод в канал для админов
async function sendWithdrawalToChannel(ctx, withdrawalRequest, userInfo) {
    try {
        const channelUsername = '@magnumwithdraw';

        // Получаем username из информации о пользователе
        const username = userInfo?.username ? `@${userInfo.username}` : 'Не указан';

        const adminMessage = `📋 **Новая заявка на вывод**\n\n` +
            `👤 **Пользователь:**\n` +
            `├ 🆔 ID: \`${withdrawalRequest.userId}\`\n` +
            `└ 🏷️ Username: ${username}\n\n` +
            `💰 **Детали заявки:**\n` +
            `├ 🆔 ID заявки: №${withdrawalRequest.id}\n` +
            `├ 💰 Сумма: ${withdrawalRequest.amount} ⭐ Stars\n` +
            `├ 📅 Дата: ${new Date(withdrawalRequest.createdAt).toLocaleDateString('ru-RU')}\n` +
            `└ ⏰ Время: ${new Date(withdrawalRequest.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
            `🎯 **Действия:**`;
        
        const adminKeyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('✅ Одобрить', `approve_withdrawal_${withdrawalRequest.id}`),
                Markup.button.callback('❌ Отклонить', `reject_withdrawal_${withdrawalRequest.id}`)
            ]
        ]);
        
        // Отправляем в канал
        await ctx.telegram.sendMessage(channelUsername, adminMessage, {
            parse_mode: 'Markdown',
            reply_markup: adminKeyboard.reply_markup
        });
        
        logger.info('Заявка на вывод отправлена в канал', { 
            userId: withdrawalRequest.userId, 
            requestId: withdrawalRequest.id,
            channel: channelUsername
        });
        
    } catch (error) {
        logger.error('Ошибка отправки заявки в канал', error, { 
            userId: withdrawalRequest.userId, 
            requestId: withdrawalRequest.id 
        });
    }
}

module.exports = infoHandler;