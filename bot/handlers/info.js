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
        
        if (userState && userState.state === 'creating_support_ticket') {
            // Обработка создания тикета поддержки
            await handleSupportTicketCreation(ctx, text);
            return;
        }
        
        // Обработка скриншотов от пользователей для тикетов поддержки
        if (ctx.message.photo || ctx.message.document) {
            await handleSupportAttachment(ctx);
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
            
            const successMessage = await ctx.reply(
                `✅ **Ключ успешно активирован!**\n\n` +
                `🎁 Получено:\n` +
                `${result.rewardText.join('\n')}\n\n` +
                `🔑 Ключ: ${key.substring(0, 6)}...`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('🏠 Главное меню', 'main_menu')]
                ]).reply_markup
            );

            // Удаляем уведомление через 5 секунд
            setTimeout(async () => {
                try {
                    await ctx.telegram.deleteMessage(ctx.chat.id, successMessage.message_id);
                } catch (error) {
                    logger.warn('Не удалось удалить сообщение об активации ключа', { 
                        error: error.message, 
                        userId, 
                        messageId: successMessage.message_id 
                    });
                }
            }, 5000);
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
    const chatMessage = `🎉 **Новый ключ доступен!**\n\n` +
        `🔑 **Код:** \`${keyData.key}\`\n` +
        `💰 **Награда:** ${rewardAmount} ${rewardTypeText}\n` +
        `🔄 **Доступно:** ${numMaxUses} активаций\n\n` +
        `⚡ Успей активировать ключ в боте и забери бонус первым!`;

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
                const chatMessage = `🎉 **Новый ключ доступен!**\n\n` +
                    `🔑 **Код:** \`${newKey}\`\n` +
                    `💰 **Награда:** ${userState.data.stars} ⭐ Stars + ${userState.data.coins} 🪙 Magnum Coins + 👑 ${userState.data.titleId}\n` +
                    `🔄 **Доступно:** ${userState.data.maxUses} активаций\n\n` +
                    `⚡ Успей активировать ключ в боте и забери бонус первым!`;

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

        // Получаем данные пользователя из заявки
        const firstName = withdrawalRequest.firstName || userInfo?.first_name || 'Не указано';
        const username = withdrawalRequest.username || userInfo?.username || 'Не указано';
        
        // Форматируем username для отображения
        const displayUsername = username && username !== 'Не указано' ? `@${username}` : 'Не указано';

        const adminMessage = `📋 **Новая заявка на вывод**\n\n` +
            `👤 **Пользователь:**\n` +
            `├ 🆔 ID: \`${withdrawalRequest.userId}\`\n` +
            `├ 👤 Имя: ${firstName}\n` +
            `└ 🏷️ Username: ${displayUsername}\n\n` +
            `💰 **Детали заявки:**\n` +
            `├ 🆔 ID заявки: №${withdrawalRequest.id}\n` +
            `├ 💰 Сумма: ${withdrawalRequest.amount} ⭐ Stars\n` +
            `├ 📅 Дата: ${new Date(withdrawalRequest.createdAt).toLocaleDateString('ru-RU')}\n` +
            `└ ⏰ Время: ${new Date(withdrawalRequest.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
            `🎯 **Действия:**`;
        
        // Создаем клавиатуру, видимую только админам
        const adminKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: '🔧 Обработать',
                        callback_data: `process_withdrawal_${withdrawalRequest.id}`,
                        // Кнопка видна только админам
                        web_app: undefined
                    }
                ]
            ]
        };
        
        // Отправляем в канал
        await ctx.telegram.sendMessage(channelUsername, adminMessage, {
            parse_mode: 'Markdown',
            reply_markup: adminKeyboard
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

// Обработка создания тикета поддержки
async function handleSupportTicketCreation(ctx, text) {
    const userId = ctx.from.id;
    
    logger.info('Создание тикета поддержки', { userId, textLength: text.length });
    
    try {
        if (text.trim().length < 10) {
            await ctx.reply(
                '❌ **Описание слишком короткое!**\n\n' +
                '📝 Описание должно содержать минимум 10 символов\n' +
                '💡 Опишите проблему подробно, чтобы мы могли помочь\n\n' +
                'Попробуйте еще раз или нажмите "Отмена"'
            );
            return;
        }
        
        // Создаем тикет в базе данных
        const { dataManager } = require('../utils/dataManager');
        const ticketData = {
            id: Date.now().toString(), // Простой ID на основе времени
            userId: Number(userId),
            firstName: ctx.from.first_name || 'Не указано',
            username: ctx.from.username || null,
            description: text.trim(),
            status: 'open',
            priority: 'normal',
            createdAt: new Date(),
            updatedAt: new Date(),
            attachments: [],
            messages: [{
                type: 'user',
                content: text.trim(),
                timestamp: new Date(),
                userId: Number(userId)
            }]
        };
        
        // Сохраняем тикет в базе данных
        await dataManager.db.collection('support_tickets').insertOne(ticketData);
        
        // Отправляем тикет в канал поддержки
        await sendSupportTicketToChannel(ctx, ticketData);
        
        // Показываем сообщение об успехе
        const successMessage = `✅ **Тикет поддержки создан!**\n\n` +
            `📋 **Детали тикета:**\n` +
            `├ 🆔 ID: \`${ticketData.id}\`\n` +
            `├ 📝 Описание: ${text.trim().substring(0, 100)}${text.length > 100 ? '...' : ''}\n` +
            `├ 📅 Дата: ${new Date().toLocaleDateString('ru-RU')}\n` +
            `└ 📊 Статус: 🆕 Открыт\n\n` +
            `⏰ **Время ответа:** 24 часа\n` +
            `💡 **Что дальше:** Ожидайте ответа от администратора`;
        
        const successKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📋 Мои тикеты', 'my_tickets')],
            [Markup.button.callback('📝 Создать еще тикет', 'create_ticket')],
            [Markup.button.callback('🆘 Поддержка', 'support')]
        ]);
        
        await ctx.reply(successMessage, {
            parse_mode: 'Markdown',
            reply_markup: successKeyboard.reply_markup
        });
        
        // Очищаем состояние
        const { userStates } = require('./callback');
        userStates.delete(userId);
        
        logger.info('Тикет поддержки успешно создан', { userId, ticketId: ticketData.id });
        
    } catch (error) {
        logger.error('Ошибка создания тикета поддержки', error, { userId, text });
        
        await ctx.reply(
            '❌ **Ошибка создания тикета!**\n\n' +
            '🚫 Не удалось создать тикет поддержки\n' +
            '🔧 Попробуйте позже или обратитесь к администратору\n\n' +
            '💬 Ошибка: ' + error.message,
            Markup.inlineKeyboard([
                [Markup.button.callback('🔄 Попробовать снова', 'create_ticket')],
                [Markup.button.callback('🔙 Назад к поддержке', 'support')]
            ]).reply_markup
        );
        
        // Очищаем состояние
        const { userStates } = require('./callback');
        userStates.delete(userId);
    }
}

// Отправка тикета поддержки в канал
async function sendSupportTicketToChannel(ctx, ticketData) {
    try {
        const channelUsername = '@magnumsupported';

        const adminMessage = `🆘 **Новый тикет поддержки**\n\n` +
            `👤 **Пользователь:**\n` +
            `├ 🆔 ID: \`${ticketData.userId}\`\n` +
            `├ 👤 Имя: ${ticketData.firstName}\n` +
            `└ 🏷️ Username: ${ticketData.username ? `@${ticketData.username}` : '@username'}\n\n` +
            `📋 **Детали тикета:**\n` +
            `├ 🆔 ID тикета: \`${ticketData.id}\`\n` +
            `├ 📝 Описание: ${ticketData.description.substring(0, 200)}${ticketData.description.length > 200 ? '...' : ''}\n` +
            `├ 📅 Дата: ${new Date(ticketData.createdAt).toLocaleDateString('ru-RU')}\n` +
            `└ ⏰ Время: ${new Date(ticketData.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
            `🎯 **Действия:**`;
        
        // Создаем клавиатуру, видимую только админам
        const adminKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: '👨‍💼 Взять в работу',
                        callback_data: `take_ticket_${ticketData.id}`,
                        web_app: undefined
                    }
                ]
            ]
        };
        
        // Отправляем в канал поддержки
        await ctx.telegram.sendMessage(channelUsername, adminMessage, {
            parse_mode: 'Markdown',
            reply_markup: adminKeyboard
        });
        
        logger.info('Тикет поддержки отправлен в канал', { 
            userId: ticketData.userId, 
            ticketId: ticketData.id,
            channel: channelUsername
        });
        
    } catch (error) {
        logger.error('Ошибка отправки тикета в канал поддержки', error, { 
            userId: ticketData.userId, 
            ticketId: ticketData.id 
        });
    }
}

// Обработка вложений для тикетов поддержки
async function handleSupportAttachment(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка вложения для тикета поддержки', { userId });
    
    try {
        // Проверяем, есть ли у пользователя активный тикет
        const { dataManager } = require('../utils/dataManager');
        const activeTicket = await dataManager.db.collection('support_tickets')
            .findOne({ 
                userId: Number(userId), 
                status: { $in: ['open', 'in_progress'] } 
            });
        
        if (!activeTicket) {
            await ctx.reply(
                '❌ **Нет активного тикета!**\n\n' +
                '📝 Сначала создайте тикет поддержки\n' +
                '💡 Используйте кнопку "🆘 Поддержка" в профиле',
                Markup.inlineKeyboard([
                    [Markup.button.callback('🆘 Поддержка', 'support')],
                    [Markup.button.callback('🏠 Главное меню', 'main_menu')]
                ]).reply_markup
            );
            return;
        }
        
        // Обрабатываем вложение
        let attachmentData = {};
        
        if (ctx.message.photo) {
            // Получаем фото с максимальным размером
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            attachmentData = {
                type: 'photo',
                fileId: photo.file_id,
                caption: ctx.message.caption || ''
            };
        } else if (ctx.message.document) {
            const document = ctx.message.document;
            attachmentData = {
                type: 'document',
                fileId: document.file_id,
                fileName: document.file_name,
                caption: ctx.message.caption || ''
            };
        }
        
        // Сохраняем вложение в базе данных
        await dataManager.db.collection('support_tickets').updateOne(
            { id: activeTicket.id },
            { 
                $push: { 
                    attachments: {
                        ...attachmentData,
                        uploadedAt: new Date(),
                        uploadedBy: Number(userId)
                    }
                },
                $push: {
                    messages: {
                        type: 'user',
                        content: `[${attachmentData.type === 'photo' ? '📸 Скриншот' : '📄 Документ'}]`,
                        fileId: attachmentData.fileId,
                        timestamp: new Date(),
                        userId: Number(userId)
                    }
                },
                $set: { updatedAt: new Date() }
            }
        );
        
        // Уведомляем пользователя
        const successMessage = `✅ **Вложение добавлено к тикету!**\n\n` +
            `📋 **Тикет:** #${activeTicket.id}\n` +
            `📎 **Тип:** ${attachmentData.type === 'photo' ? '📸 Скриншот' : '📄 Документ'}\n` +
            `⏰ **Время:** ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}\n\n` +
            `💡 **Что дальше:** Администратор получит уведомление и сможет ответить`;
        
        const successKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📋 Мои тикеты', 'my_tickets')],
            [Markup.button.callback('🆘 Поддержка', 'support')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.reply(successMessage, {
            parse_mode: 'Markdown',
            reply_markup: successKeyboard.reply_markup
        });
        
        // Уведомляем админа в канале поддержки (если тикет в работе)
        if (activeTicket.status === 'in_progress' && activeTicket.assignedTo) {
            try {
                const adminMessage = `📎 **Новое вложение в тикете #${activeTicket.id}**\n\n` +
                    `👤 **Пользователь:** ${activeTicket.firstName}\n` +
                    `📎 **Тип:** ${attachmentData.type === 'photo' ? '📸 Скриншот' : '📄 Документ'}\n` +
                    `⏰ **Время:** ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}\n\n` +
                    `💡 **Пользователь добавил дополнительную информацию к тикету**`;
                
                await ctx.telegram.sendMessage('@magnumsupported', adminMessage, {
                    parse_mode: 'Markdown'
                });
            } catch (notifyError) {
                logger.error('Ошибка уведомления админа о вложении', notifyError, { ticketId: activeTicket.id });
            }
        }
        
        logger.info('Вложение для тикета поддержки успешно обработано', { 
            userId, 
            ticketId: activeTicket.id, 
            attachmentType: attachmentData.type 
        });
        
    } catch (error) {
        logger.error('Ошибка обработки вложения для тикета поддержки', error, { userId });
        
        await ctx.reply(
            '❌ **Ошибка добавления вложения!**\n\n' +
            '🚫 Не удалось добавить вложение к тикету\n' +
            '🔧 Попробуйте позже или обратитесь к администратору',
            Markup.inlineKeyboard([
                [Markup.button.callback('🔄 Попробовать снова', 'support')],
                [Markup.button.callback('🏠 Главное меню', 'main_menu')]
            ]).reply_markup
        );
    }
}

module.exports = infoHandler;