// MagnumStarBot WebApp JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('MagnumStarBot WebApp загружен');

    // Получаем userId из URL параметров или localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let userId = urlParams.get('userId') || localStorage.getItem('magnumBot_userId');

    // Конвертируем userId в число, если это возможно
    if (userId && typeof userId === 'string') {
        const numericUserId = parseInt(userId);
        if (!isNaN(numericUserId)) {
            userId = numericUserId;
            console.log('🔄 Конвертировал userId из строки в число:', {
                original: urlParams.get('userId') || localStorage.getItem('magnumBot_userId'),
                converted: userId,
                type: typeof userId
            });
        }
    }

    console.log('🔍 Получение userId:', {
        fromURL: urlParams.get('userId'),
        fromLocalStorage: localStorage.getItem('magnumBot_userId'),
        currentUserId: userId,
        userIdType: typeof userId
    });

    // Проверяем Telegram WebApp API для автоматического получения userId
    if (window.Telegram && window.Telegram.WebApp) {
        const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
        console.log('🔍 Telegram WebApp данные:', {
            webAppAvailable: true,
            initDataUnsafe: !!window.Telegram.WebApp.initDataUnsafe,
            user: telegramUser ? {
                id: telegramUser.id,
                username: telegramUser.username,
                first_name: telegramUser.first_name
            } : null
        });

        if (telegramUser && telegramUser.id) {
            userId = telegramUser.id.toString();
            localStorage.setItem('magnumBot_userId', userId);
            console.log('✅ User ID получен автоматически через Telegram WebApp:', userId);
        } else {
            console.log('⚠️ Telegram WebApp доступен, но userId не найден');
        }
    } else {
        console.log('❌ Telegram WebApp не доступен');
    }

    console.log('🎯 Финальный userId для использования:', userId);

    if (!userId) {
        // Если userId не найден, показываем демо режим
        console.log('🎮 UserId не найден, запускаем демо режим');
        showDemoMode();
        return;
    }

    // Сохраняем userId в localStorage для будущих посещений
    localStorage.setItem('magnumBot_userId', userId);
    console.log('💾 Сохранен userId в localStorage:', {
        userId: userId,
        userIdType: typeof userId
    });

    // Добавляем кнопку сброса данных для авторизованного пользователя
    addResetButton();

    // Загружаем данные пользователя
    loadUserData(userId);

    // Анимация появления панели баланса
    const balanceNavbar = document.querySelector('.balance-navbar');
    balanceNavbar.style.transform = 'translateY(-100%)';
    balanceNavbar.style.opacity = '0';

    setTimeout(() => {
        balanceNavbar.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        balanceNavbar.style.transform = 'translateY(0)';
        balanceNavbar.style.opacity = '1';
    }, 300);

    // Функция загрузки данных пользователя
    async function loadUserData(userId) {
        try {
            console.log(`🔄 Загружаем данные пользователя ${userId}...`);

            // Загружаем баланс
            await loadUserBalance(userId);

            // Загружаем профиль
            await loadUserProfile(userId);

        } catch (error) {
            console.error('❌ Ошибка загрузки данных пользователя:', error);
            showError('Не удалось загрузить данные пользователя');
        }
    }

    // Функция загрузки баланса пользователя
    async function loadUserBalance(userId) {
        try {
            console.log('📡 Запрос баланса:', {
                userId: userId,
                userIdType: typeof userId,
                url: `/api/balance/${userId}`
            });

            const response = await fetch(`/api/balance/${userId}`);
            const data = await response.json();

            if (data.success) {
                console.log('✅ Баланс загружен:', data.data);

                // Обновляем баланс звезд
                updateBalanceDisplay('stars', data.data.stars);

                // Обновляем баланс магнум коинов
                updateBalanceDisplay('magnum', data.data.magnumCoins);

                // Показываем уведомление об обновлении
                showBalanceUpdate();

            } else {
                console.error('❌ Ошибка получения баланса:', data.error);
                showError('Не удалось загрузить баланс');
            }
        } catch (error) {
            console.error('❌ Ошибка сети при загрузке баланса:', error);
            showError('Ошибка подключения к серверу');
        }
    }

    // Функция загрузки профиля пользователя
    async function loadUserProfile(userId) {
        try {
            console.log('📡 Запрос профиля:', {
                userId: userId,
                userIdType: typeof userId,
                url: `/api/profile/${userId}`
            });

            const response = await fetch(`/api/profile/${userId}`);
            const data = await response.json();

            if (data.success) {
                console.log('✅ Профиль загружен:', data.data);

                // Обновляем информацию о пользователе
                updateUserInfo(data.data);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки профиля:', error);
        }
    }

    // Функция обновления отображения баланса с анимацией
    function updateBalanceDisplay(type, amount) {
        const balanceElement = document.getElementById(`${type}-balance`);
        if (balanceElement) {
            const currentAmount = parseInt(balanceElement.textContent.replace(',', '') || '0');
            const targetAmount = amount;

            // Анимация счетчика
            animateNumber(balanceElement, currentAmount, targetAmount, 1000);
        }
    }

    // Функция показа уведомления об обновлении баланса
    function showBalanceUpdate() {
        // Создаем временное уведомление
        const notification = document.createElement('div');
        notification.textContent = 'Баланс обновлен';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(0, 110, 46, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Функция обновления информации о пользователе
    function updateUserInfo(profile) {
        console.log('📊 Обновляем информацию о пользователе:', profile);

        // Обновляем заголовок с именем пользователя
        const headerTitle = document.querySelector('.header h1');
        if (profile.username) {
            headerTitle.textContent = `Привет, ${profile.username}!`;
        } else if (profile.firstName) {
            headerTitle.textContent = `Привет, ${profile.firstName}!`;
        }

        // Показываем статистику пользователя
        const userStats = document.getElementById('user-stats');

        if (profile.balance && profile.balance.totalEarned) {
            // Обновляем статистику заработка
            const totalEarnedStars = document.getElementById('total-earned-stars');
            const totalEarnedCoins = document.getElementById('total-earned-coins');

            if (totalEarnedStars) {
                totalEarnedStars.textContent = `${profile.balance.totalEarned.stars.toLocaleString()} ⭐`;
            }
            if (totalEarnedCoins) {
                totalEarnedCoins.textContent = `${profile.balance.totalEarned.coins.toLocaleString()} 🪙`;
            }

            // Показываем блок статистики
            userStats.style.display = 'block';
        }


    }

    // Функция показа демо режима
    function showDemoMode() {
        console.log('🎮 Запуск демо режима...');

        // Устанавливаем демо данные
        updateBalanceDisplay('stars', 1250);
        updateBalanceDisplay('magnum', 5678);

        // Показываем демо статистику
        const userStats = document.getElementById('user-stats');
        const totalEarnedStars = document.getElementById('total-earned-stars');
        const totalEarnedCoins = document.getElementById('total-earned-coins');

        if (totalEarnedStars) totalEarnedStars.textContent = '2,500 ⭐';
        if (totalEarnedCoins) totalEarnedCoins.textContent = '11,350 🪙';
        if (userStats) userStats.style.display = 'block';

        // Меняем заголовок на демо режим
        const headerTitle = document.querySelector('.header h1');
        if (headerTitle) {
            headerTitle.textContent = 'MagnumStarBot (Демо)';
        }

        // Показываем кнопку для ввода User ID
        const enterUserIdBtn = document.getElementById('enter-user-id-btn');
        if (enterUserIdBtn) {
            enterUserIdBtn.style.display = 'block';
            enterUserIdBtn.textContent = 'Ввести User ID';
            enterUserIdBtn.addEventListener('click', showUserIdPrompt);
        }

        // Добавляем кнопку для сброса данных
        addResetButton();

        // Показываем уведомление о демо режиме
        setTimeout(() => {
            showError('🎮 Это демо режим. Нажмите "Ввести User ID" для просмотра вашего реального баланса.');
        }, 2000);

        // Запускаем пульсирующий эффект для привлечения внимания
        setTimeout(addPulseEffect, 1000);
    }

    // Функция добавления кнопки сброса данных
    function addResetButton() {
        const existingResetBtn = document.getElementById('reset-user-id-btn');
        if (existingResetBtn) {
            existingResetBtn.remove();
        }

        const resetBtn = document.createElement('button');
        resetBtn.id = 'reset-user-id-btn';
        resetBtn.textContent = '🔄 Сбросить данные';
        resetBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 8px 12px;
            background: rgba(255, 0, 0, 0.8);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            z-index: 1000;
            transition: all 0.3s ease;
        `;

        resetBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 0, 0, 1)';
            this.style.transform = 'scale(1.05)';
        });

        resetBtn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 0, 0, 0.8)';
            this.style.transform = 'scale(1)';
        });

        resetBtn.addEventListener('click', function() {
            const confirmMessage = userId
                ? 'Вы уверены, что хотите сбросить данные и ввести новый User ID?'
                : 'Вы уверены, что хотите сбросить все сохраненные данные?';

            if (confirm(confirmMessage)) {
                localStorage.removeItem('magnumBot_userId');
                location.reload();
            }
        });

        document.body.appendChild(resetBtn);
    }

    // Функция показа формы для ввода userId (теперь вызывается только при необходимости)
    function showUserIdPrompt() {
        const promptDiv = document.createElement('div');
        promptDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                ">
                    <h2 style="margin-bottom: 20px; color: #006e2e;">Введите ваш User ID</h2>
                    <p style="margin-bottom: 20px; color: #666;">
                        User ID можно найти в Telegram боте или получить через @userinfobot
                    </p>
                    <input type="text" id="userIdInput" placeholder="Например: 123456789"
                           style="width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px;">
                    <button id="submitUserId" style="
                        background: #006e2e;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 16px;
                        cursor: pointer;
                        width: 100%;
                    ">Войти</button>
                </div>
            </div>
        `;

        document.body.appendChild(promptDiv);

        // Обработчик кнопки
        document.getElementById('submitUserId').addEventListener('click', function() {
            const userIdInput = document.getElementById('userIdInput').value.trim();
            console.log('👤 Пользователь ввел User ID:', {
                input: userIdInput,
                inputType: typeof userIdInput
            });

            // Конвертируем в число при необходимости
            let userId = userIdInput;
            const numericUserId = parseInt(userIdInput);
            if (!isNaN(numericUserId)) {
                userId = numericUserId;
                console.log('🔄 Конвертировал введенный userId из строки в число:', {
                    original: userIdInput,
                    converted: userId,
                    type: typeof userId
                });
            }

            if (userId) {
                localStorage.setItem('magnumBot_userId', userId);
                promptDiv.remove();

                // Убираем кнопку сброса, если она была
                const resetBtn = document.getElementById('reset-user-id-btn');
                if (resetBtn) {
                    resetBtn.remove();
                }

                loadUserData(userId);
            } else {
                alert('Пожалуйста, введите User ID');
            }
        });

        // Обработчик клавиши Enter
        document.getElementById('userIdInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('submitUserId').click();
            }
        });

        // Добавляем логирование при фокусе на поле ввода
        document.getElementById('userIdInput').addEventListener('focus', function() {
            console.log('🎯 Поле ввода userId получило фокус');
        });
    }

    // Функция показа ошибок
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 100px;
            left: 20px;
            background: #ff4444;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 3000);
    }

    // Анимация чисел
    function animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const difference = end - start;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Используем easeOut функцию для плавной анимации
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + difference * easeOutProgress);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // Пульсирующий эффект для баланса
    function addPulseEffect() {
        const balanceItems = document.querySelectorAll('.balance-item');

        balanceItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.animation = 'pulse 2s infinite';
            }, index * 500);
        });
    }

    // Добавляем CSS анимацию pulse
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    // Запускаем пульсирующий эффект через 2 секунды
    setTimeout(addPulseEffect, 2000);

    // Запускаем автоматическое обновление баланса каждые 30 секунд
    setInterval(() => loadUserBalance(userId), 30000);



    // Простая анимация заголовка
    const header = document.querySelector('.header h1');
    let hue = 0;

    setInterval(() => {
        hue = (hue + 1) % 360;
        header.style.textShadow = `2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px hsl(${hue}, 70%, 50%)`;
    }, 50);
});
