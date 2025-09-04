// MagnumStarBot WebApp JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔥 MagnumStarBot WebApp загружен');
    console.log('🔥 DOM готов, проверяем элементы...');
    
    // Проверяем наличие кнопок навигации
    const earnBtn = document.getElementById('earn-btn');
    const tasksBtn = document.getElementById('tasks-btn');
    console.log('🔥 earn-btn найден:', !!earnBtn);
    console.log('🔥 tasks-btn найден:', !!tasksBtn);

    // Упрощенная логика получения userId
    let userId = getUserId();

    if (userId) {
        // Если userId найден, загружаем приложение
        initializeApp(userId);
    } else {
        // Если userId не найден, показываем простую форму ввода
        showSimpleLoginForm();
    }

    // Упрощенная функция получения userId
    function getUserId() {
        // 1. Проверяем URL параметры
    const urlParams = new URLSearchParams(window.location.search);
        let userId = urlParams.get('userId');

        if (userId) {
        const numericUserId = parseInt(userId);
        if (!isNaN(numericUserId)) {
                console.log('✅ User ID получен из URL:', numericUserId);
                return numericUserId;
            }
        }

        // 2. Проверяем localStorage
        userId = localStorage.getItem('magnumBot_userId');
        if (userId) {
            const numericUserId = parseInt(userId);
            if (!isNaN(numericUserId)) {
                console.log('✅ User ID получен из localStorage:', numericUserId);
                return numericUserId;
            }
        }

        // 3. Пытаемся получить из Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            window.Telegram.WebApp.ready();
            const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
                
            if (telegramUser && telegramUser.id) {
                    console.log('✅ User ID получен из Telegram WebApp:', telegramUser.id);
                    return telegramUser.id;
                }
            } catch (error) {
                console.log('⚠️ Ошибка получения userId из Telegram WebApp:', error.message);
            }
        }

        console.log('❌ User ID не найден');
        return null;
    }

    // Инициализация приложения
    function initializeApp(userId) {
        // Сохраняем userId в localStorage
        localStorage.setItem('magnumBot_userId', userId.toString());

        // Загружаем данные пользователя
        loadUserData(userId);
        
        // Показываем страницу "Заработать" по умолчанию
        showEarnPage();

    // Анимация появления панели баланса
        animateBalancePanel();
    }

    // Простая форма входа
    function showSimpleLoginForm() {
        const loginForm = document.createElement('div');
        loginForm.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 110, 46, 0.95);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                ">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🚀</div>
                    <h2 style="margin-bottom: 20px; color: #006e2e; font-size: 1.8rem;">Добро пожаловать!</h2>
                    <p style="margin-bottom: 30px; color: #666; line-height: 1.5;">
                        Введите ваш User ID для входа в веб-приложение MagnumStarBot
                    </p>
                    
                    <div style="margin-bottom: 20px;">
                        <input type="text" id="userIdInput" placeholder="Например: 123456789" 
                               style="width: 100%; padding: 15px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 16px; text-align: center; box-sizing: border-box;">
                    </div>
                    
                    <button id="loginBtn" style="
                        background: #006e2e;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 25px;
                        font-size: 16px;
                        cursor: pointer;
                        width: 100%;
                        margin-bottom: 15px;
                        transition: all 0.3s ease;
                    ">Войти</button>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px; text-align: left;">
                        <p style="margin: 0 0 10px 0; color: #333; font-weight: bold; font-size: 14px;">💡 Как получить User ID:</p>
                        <ol style="margin: 0; padding-left: 20px; color: #666; font-size: 13px; line-height: 1.4;">
                            <li>Напишите боту <strong>@userinfobot</strong></li>
                            <li>Или используйте команду <code>/start</code> в @MagnumStarBot</li>
                            <li>Скопируйте ваш ID (число)</li>
                        </ol>
                    </div>
                    
                    <div style="margin-top: 15px;">
                        <button onclick="window.open('https://t.me/MagnumStarBot', '_blank')" style="
                            background: #0088cc;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 20px;
                            font-size: 14px;
                            cursor: pointer;
                            margin-right: 10px;
                        ">Открыть бота</button>
                        
                        <button onclick="window.open('https://t.me/userinfobot', '_blank')" style="
                            background: #28a745;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 20px;
                            font-size: 14px;
                            cursor: pointer;
                        ">Получить ID</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(loginForm);

        // Обработчики событий
        const userIdInput = document.getElementById('userIdInput');
        const loginBtn = document.getElementById('loginBtn');

        // Автофокус на поле ввода
        userIdInput.focus();

        // Обработчик кнопки входа
        loginBtn.addEventListener('click', function() {
            const inputValue = userIdInput.value.trim();
            const numericUserId = parseInt(inputValue);
            
            if (!isNaN(numericUserId) && numericUserId > 0) {
                loginForm.remove();
                initializeApp(numericUserId);
            } else {
                // Показываем ошибку
                userIdInput.style.borderColor = '#ff4444';
                userIdInput.placeholder = 'Введите корректный User ID (число)';
                userIdInput.value = '';
                
                setTimeout(() => {
                    userIdInput.style.borderColor = '#e0e0e0';
                    userIdInput.placeholder = 'Например: 123456789';
                }, 3000);
            }
        });

        // Обработчик клавиши Enter
        userIdInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });

        // Обработчик изменения поля ввода
        userIdInput.addEventListener('input', function() {
            this.style.borderColor = '#e0e0e0';
        });
    }

    // Анимация панели баланса
    function animateBalancePanel() {
    const balanceNavbar = document.querySelector('.balance-navbar');
    balanceNavbar.style.transform = 'translateY(-100%)';
    balanceNavbar.style.opacity = '0';

    setTimeout(() => {
        balanceNavbar.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        balanceNavbar.style.transform = 'translateY(0)';
        balanceNavbar.style.opacity = '1';
    }, 300);
    }

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
        } else {
            headerTitle.textContent = 'MagnumStarBot';
        }
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

    // Запускаем автоматическое обновление баланса каждые 30 секунд (только для авторизованных пользователей)
    let balanceUpdateInterval;
    if (userId) {
        balanceUpdateInterval = setInterval(() => {
            if (userId) {
                loadUserBalance(userId);
            }
        }, 30000);
    }



    // Простая анимация заголовка
    const header = document.querySelector('.header h1');
    let hue = 0;

    setInterval(() => {
        hue = (hue + 1) % 360;
        header.style.textShadow = `2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px hsl(${hue}, 70%, 50%)`;
    }, 50);

    // Загружаем энергию при инициализации
    if (userId) {
        loadUserEnergy(userId);
    }
});

// Функции навигации (глобальные)
function showEarnPage() {
    console.log('🔥 showEarnPage вызвана!');
    console.log('Показываем страницу "Заработать"');
    
    // Обновляем активную кнопку
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('earn-btn').classList.add('active');
    
    // Загружаем контент страницы "Заработать"
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="page-content active">
            <div class="page-header">
                <h2 class="page-title">⭐ Заработать</h2>
                <p class="page-subtitle">Кликайте по монете и зарабатывайте награды!</p>
            </div>
            
            <!-- Кнопка-монета для заработка -->
            <div class="coin-container-page">
                <button class="coin-button" id="coin-button" onclick="clickCoin()">
                    <div class="coin-inner">
                        <div class="coin-icon">🪙</div>
                        <div class="coin-text">Клик!</div>
                    </div>
                </button>
                <div class="coin-rewards" id="coin-rewards">
                    <div class="reward-item">
                        <span class="reward-icon">💰</span>
                        <span class="reward-text">+1</span>
                    </div>
                    <div class="reward-item">
                        <span class="reward-icon">⭐</span>
                        <span class="reward-text">+0.001</span>
                    </div>
                </div>
                <div class="energy-info">
                    <div class="energy-text">⚡ Энергия: <span id="energy-display">1000/1000</span></div>
                    <div class="energy-description">1 клик = 1 энергия. Восстанавливается 1 энергия в секунду</div>
                </div>
            </div>
        </div>
    `;
}

function showTasksPage() {
    console.log('🔥 showTasksPage вызвана!');
    console.log('Показываем страницу "Задания"');
    
    // Обновляем активную кнопку
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tasks-btn').classList.add('active');
    
    // Загружаем контент страницы "Задания"
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="page-content active">
            <div class="page-header">
                <h2 class="page-title">📋 Задания</h2>
                <p class="page-subtitle">Выполняйте задания для получения дополнительных наград</p>
            </div>
            
            <div class="coming-soon">
                <div class="coming-soon-icon">🎯</div>
                <h3>Скоро будет доступно</h3>
                <p>Система заданий будет добавлена в ближайшее время</p>
            </div>
        </div>
    `;
}

// Глобальные переменные для энергии
let currentEnergy = 1000;
let maxEnergy = 1000;
let energyUpdateInterval;

// Функция загрузки энергии пользователя
async function loadUserEnergy(userId) {
    try {
        console.log('⚡ Загружаем энергию пользователя:', userId);
        
        const response = await fetch(`/api/energy/${userId}`);
        const data = await response.json();
        
        if (data.success) {
            currentEnergy = data.data.current;
            maxEnergy = data.data.max;
            
            updateEnergyDisplay();
            console.log('✅ Энергия загружена:', data.data);
        } else {
            console.error('❌ Ошибка загрузки энергии:', data.error);
        }
    } catch (error) {
        console.error('❌ Ошибка сети при загрузке энергии:', error);
    }
}

// Функция обновления отображения энергии
function updateEnergyDisplay() {
    const energyBalance = document.getElementById('energy-balance');
    const energyDisplay = document.getElementById('energy-display');
    
    if (energyBalance) {
        energyBalance.textContent = currentEnergy;
    }
    
    if (energyDisplay) {
        energyDisplay.textContent = `${currentEnergy}/${maxEnergy}`;
    }
    
    // Обновляем состояние кнопки
    const coinButton = document.getElementById('coin-button');
    if (coinButton) {
        if (currentEnergy < 1) {
            coinButton.disabled = true;
            coinButton.style.opacity = '0.5';
        } else {
            coinButton.disabled = false;
            coinButton.style.opacity = '1';
        }
    }
}

// Функция клика по монете
async function clickCoin() {
    const userId = localStorage.getItem('magnumBot_userId');
    if (!userId) {
        showError('Пользователь не авторизован');
        return;
    }
    
    if (currentEnergy < 1) {
        showError('Недостаточно энергии!');
        return;
    }
    
    const coinButton = document.getElementById('coin-button');
    if (coinButton.disabled) return;
    
    try {
        // Анимация клика
        coinButton.classList.add('clicked');
        setTimeout(() => {
            coinButton.classList.remove('clicked');
        }, 300);
        
        // Отправляем запрос на сервер
        const response = await fetch(`/api/click/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Обновляем энергию
            currentEnergy = data.data.energy.current;
            maxEnergy = data.data.energy.max;
            updateEnergyDisplay();
            
            // Обновляем баланс
            updateBalanceDisplay('stars', data.data.balance.stars);
            updateBalanceDisplay('magnum', data.data.balance.magnumCoins);
            
            // Показываем анимацию награды
            showRewardAnimation(data.data.rewards);
            
            console.log('✅ Клик обработан:', data.data);
        } else {
            showError(data.error || 'Ошибка при клике');
        }
    } catch (error) {
        console.error('❌ Ошибка клика по монете:', error);
        showError('Ошибка подключения к серверу');
    }
}

// Функция показа анимации награды
function showRewardAnimation(rewards) {
    const coinButton = document.getElementById('coin-button');
    if (!coinButton) return;
    
    // Создаем попапы для наград
    const coinRect = coinButton.getBoundingClientRect();
    const centerX = coinRect.left + coinRect.width / 2;
    const centerY = coinRect.top + coinRect.height / 2;
    
    // Анимация для магнум коинов
    const coinPopup = document.createElement('div');
    coinPopup.className = 'reward-popup';
    coinPopup.textContent = `+${rewards.coins} 💰`;
    coinPopup.style.left = `${centerX - 20}px`;
    coinPopup.style.top = `${centerY - 20}px`;
    document.body.appendChild(coinPopup);
    
    // Анимация для звезд
    const starPopup = document.createElement('div');
    starPopup.className = 'reward-popup';
    starPopup.textContent = `+${rewards.stars} ⭐`;
    starPopup.style.left = `${centerX + 20}px`;
    starPopup.style.top = `${centerY - 20}px`;
    starPopup.style.animationDelay = '0.2s';
    document.body.appendChild(starPopup);
    
    // Удаляем попапы после анимации
    setTimeout(() => {
        if (coinPopup.parentNode) {
            coinPopup.parentNode.removeChild(coinPopup);
        }
        if (starPopup.parentNode) {
            starPopup.parentNode.removeChild(starPopup);
        }
    }, 1200);
}

// Автоматическое обновление энергии каждую секунду
function startEnergyRegeneration() {
    energyUpdateInterval = setInterval(() => {
        if (currentEnergy < maxEnergy) {
            currentEnergy = Math.min(maxEnergy, currentEnergy + 1);
            updateEnergyDisplay();
        }
    }, 1000); // 1 энергия в секунду
}

// Запускаем регенерацию энергии
startEnergyRegeneration();
