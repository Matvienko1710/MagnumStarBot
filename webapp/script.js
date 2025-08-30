// Основной JavaScript файл для главной страницы

// Глобальные переменные
let coinsBalance = 0;
let starsBalance = 0;
let totalClicks = 0;
let clicksToday = 0;
let lastClickTime = 0;
const CLICK_COOLDOWN = 1000; // 1 секунда между кликами

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadUserData();
    setupEventListeners();
});

// Инициализация приложения
function initializeApp() {
    console.log('Magnum Star Bot WebApp инициализирован');
    
    // Загружаем данные из localStorage
    loadFromStorage();
    
    // Обновляем отображение
    updateDisplay();
}

// Загрузка данных пользователя
function loadUserData() {
    // Здесь в будущем будет загрузка данных с сервера
    // Пока используем локальные данные
    console.log('Загрузка данных пользователя...');
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка клика
    const clickButton = document.getElementById('click-button');
    if (clickButton) {
        clickButton.addEventListener('click', handleClick);
    }
    
    // Кнопка "Заработать"
    const earnButton = document.getElementById('earn-button');
    if (earnButton) {
        earnButton.addEventListener('click', navigateToEarn);
    }
}

// Обработка клика по кнопке
function handleClick() {
    const now = Date.now();
    
    // Проверяем кулдаун
    if (now - lastClickTime < CLICK_COOLDOWN) {
        showMessage('Подождите немного перед следующим кликом!', 'warning');
        return;
    }
    
    // Обновляем время последнего клика
    lastClickTime = now;
    
    // Увеличиваем баланс
    coinsBalance += 1;
    totalClicks += 1;
    clicksToday += 1;
    
    // Сохраняем в localStorage
    saveToStorage();
    
    // Обновляем отображение
    updateDisplay();
    
    // Показываем анимацию
    showClickAnimation();
    
    // Показываем сообщение
    showMessage('+1 🪙 Magnum Coin!', 'success');
    
    // Отправляем данные на сервер (в будущем)
    sendClickToServer();
}

// Навигация на страницу заработка
function navigateToEarn() {
    window.location.href = 'earn.html';
}

// Показ анимации клика
function showClickAnimation() {
    const clickButton = document.getElementById('click-button');
    if (clickButton) {
        clickButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            clickButton.style.transform = 'scale(1)';
        }, 150);
    }
}

// Обновление отображения
function updateDisplay() {
    // Обновляем баланс
    const starsBalanceElement = document.getElementById('stars-balance');
    const coinsBalanceElement = document.getElementById('coins-balance');
    
    if (starsBalanceElement) {
        starsBalanceElement.textContent = starsBalance.toLocaleString();
    }
    
    if (coinsBalanceElement) {
        coinsBalanceElement.textContent = coinsBalance.toLocaleString();
    }
    
    // Обновляем статистику
    const totalClicksElement = document.getElementById('total-clicks');
    const clicksTodayElement = document.getElementById('clicks-today');
    
    if (totalClicksElement) {
        totalClicksElement.textContent = totalClicks.toLocaleString();
    }
    
    if (clicksTodayElement) {
        clicksTodayElement.textContent = clicksToday.toLocaleString();
    }
}

// Показ сообщений
function showMessage(message, type = 'info') {
    // Создаем элемент сообщения
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    // Добавляем стили
    messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Цвета для разных типов сообщений
    const colors = {
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3'
    };
    
    messageElement.style.backgroundColor = colors[type] || colors.info;
    
    // Добавляем на страницу
    document.body.appendChild(messageElement);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 3000);
}

// Сохранение в localStorage
function saveToStorage() {
    const data = {
        coinsBalance,
        starsBalance,
        totalClicks,
        clicksToday,
        lastClickTime,
        lastSaveDate: new Date().toDateString()
    };
    
    localStorage.setItem('magnumStarBotData', JSON.stringify(data));
}

// Загрузка из localStorage
function loadFromStorage() {
    try {
        const data = localStorage.getItem('magnumStarBotData');
        if (data) {
            const parsed = JSON.parse(data);
            
            // Проверяем, не устарели ли данные (новый день)
            const today = new Date().toDateString();
            if (parsed.lastSaveDate === today) {
                coinsBalance = parsed.coinsBalance || 0;
                starsBalance = parsed.starsBalance || 0;
                totalClicks = parsed.totalClicks || 0;
                clicksToday = parsed.clicksToday || 0;
                lastClickTime = parsed.lastClickTime || 0;
            } else {
                // Новый день - сбрасываем счетчик кликов за день
                coinsBalance = parsed.coinsBalance || 0;
                starsBalance = parsed.starsBalance || 0;
                totalClicks = parsed.totalClicks || 0;
                clicksToday = 0;
                lastClickTime = 0;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки данных из localStorage:', error);
    }
}

// Отправка данных на сервер (в будущем)
function sendClickToServer() {
    // Здесь будет отправка данных на сервер
    console.log('Отправка данных клика на сервер...');
    
    // Пример структуры данных для отправки
    const clickData = {
        type: 'click',
        timestamp: Date.now(),
        reward: 1,
        currency: 'coins'
    };
    
    console.log('Данные для отправки:', clickData);
}

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .message {
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
`;
document.head.appendChild(style);

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Ошибка в WebApp:', e.error);
    showMessage('Произошла ошибка в приложении', 'error');
});

// Обработка unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Необработанная ошибка промиса:', e.reason);
    showMessage('Произошла ошибка в приложении', 'error');
});

// Экспорт функций для использования в других файлах
window.magnumStarBot = {
    getBalance: () => ({ coins: coinsBalance, stars: starsBalance }),
    getStats: () => ({ totalClicks, clicksToday }),
    addCoins: (amount) => { coinsBalance += amount; updateDisplay(); saveToStorage(); },
    addStars: (amount) => { starsBalance += amount; updateDisplay(); saveToStorage(); }
};