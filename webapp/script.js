// MagnumStarBot WebApp JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('MagnumStarBot WebApp загружен');

    // Получаем userId из URL параметров или localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let userId = urlParams.get('userId') || localStorage.getItem('magnumBot_userId');

    if (!userId) {
        // Если userId не найден, показываем форму для ввода
        showUserIdPrompt();
        return;
    }

    // Сохраняем userId в localStorage для будущих посещений
    localStorage.setItem('magnumBot_userId', userId);

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

    // Функция показа формы для ввода userId
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
            const userId = document.getElementById('userIdInput').value.trim();
            if (userId) {
                localStorage.setItem('magnumBot_userId', userId);
                promptDiv.remove();
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
