// JavaScript для страницы заработка

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeEarnPage();
    setupEarnEventListeners();
});

// Инициализация страницы заработка
function initializeEarnPage() {
    console.log('Страница заработка инициализирована');
    
    // Загружаем данные пользователя
    loadUserData();
    
    // Обновляем отображение
    updateEarnDisplay();
}

// Настройка обработчиков событий
function setupEarnEventListeners() {
    // Кнопка "Назад"
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', goBack);
    }
    
    // Быстрые действия
    const dailyBonusButton = document.getElementById('daily-bonus');
    if (dailyBonusButton) {
        dailyBonusButton.addEventListener('click', () => handleQuickAction('daily_bonus'));
    }
    
    const watchAdButton = document.getElementById('watch-ad');
    if (watchAdButton) {
        watchAdButton.addEventListener('click', () => handleQuickAction('watch_ad'));
    }
    
    const completeTaskButton = document.getElementById('complete-task');
    if (completeTaskButton) {
        completeTaskButton.addEventListener('click', () => handleQuickAction('complete_task'));
    }
}

// Возврат на главную страницу
function goBack() {
    window.location.href = 'index.html';
}

// Обработка быстрых действий
function handleQuickAction(action) {
    switch (action) {
        case 'daily_bonus':
            handleDailyBonus();
            break;
        case 'watch_ad':
            handleWatchAd();
            break;
        case 'complete_task':
            handleCompleteTask();
            break;
        default:
            console.log('Неизвестное действие:', action);
    }
}

// Обработка ежедневного бонуса
function handleDailyBonus() {
    // Проверяем, можно ли получить бонус
    const lastBonusDate = localStorage.getItem('lastDailyBonus');
    const today = new Date().toDateString();
    
    if (lastBonusDate === today) {
        showMessage('Вы уже получили бонус сегодня!', 'warning');
        return;
    }
    
    // Выдаем бонус
    const bonus = Math.floor(Math.random() * 10) + 5; // 5-15 монет
    addCoins(bonus);
    
    // Сохраняем дату получения бонуса
    localStorage.setItem('lastDailyBonus', today);
    
    // Показываем сообщение
    showMessage(`🎁 Ежедневный бонус: +${bonus} 🪙 Magnum Coins!`, 'success');
    
    // Обновляем отображение
    updateEarnDisplay();
}

// Обработка просмотра рекламы
function handleWatchAd() {
    showMessage('📺 Функция просмотра рекламы в разработке', 'info');
    
    // Имитация просмотра рекламы
    setTimeout(() => {
        const reward = Math.floor(Math.random() * 3) + 1; // 1-3 монеты
        addCoins(reward);
        showMessage(`📺 Реклама просмотрена! +${reward} 🪙 Magnum Coins`, 'success');
        updateEarnDisplay();
    }, 2000);
}

// Обработка выполнения задания
function handleCompleteTask() {
    showMessage('✅ Функция выполнения заданий в разработке', 'info');
    
    // Имитация выполнения задания
    setTimeout(() => {
        const reward = Math.floor(Math.random() * 5) + 2; // 2-6 монет
        addCoins(reward);
        showMessage(`✅ Задание выполнено! +${reward} 🪙 Magnum Coins`, 'success');
        updateEarnDisplay();
    }, 1500);
}

// Добавление монет
function addCoins(amount) {
    // Получаем текущий баланс из главной страницы
    if (window.magnumStarBot) {
        window.magnumStarBot.addCoins(amount);
    } else {
        // Если главная страница не загружена, используем localStorage
        const data = localStorage.getItem('magnumStarBotData');
        if (data) {
            const parsed = JSON.parse(data);
            parsed.coinsBalance = (parsed.coinsBalance || 0) + amount;
            localStorage.setItem('magnumStarBotData', JSON.stringify(parsed));
        }
    }
}

// Загрузка данных пользователя
function loadUserData() {
    // Загружаем данные из localStorage
    const data = localStorage.getItem('magnumStarBotData');
    if (data) {
        const parsed = JSON.parse(data);
        window.userData = {
            coinsBalance: parsed.coinsBalance || 0,
            starsBalance: parsed.starsBalance || 0,
            totalClicks: parsed.totalClicks || 0,
            clicksToday: parsed.clicksToday || 0
        };
    } else {
        window.userData = {
            coinsBalance: 0,
            starsBalance: 0,
            totalClicks: 0,
            clicksToday: 0
        };
    }
}

// Обновление отображения
function updateEarnDisplay() {
    if (!window.userData) return;
    
    // Обновляем прогресс заработка
    const earnedTodayElement = document.getElementById('earned-today');
    const totalEarnedElement = document.getElementById('total-earned');
    const activityLevelElement = document.getElementById('activity-level');
    
    if (earnedTodayElement) {
        earnedTodayElement.textContent = `${window.userData.clicksToday} 🪙`;
    }
    
    if (totalEarnedElement) {
        totalEarnedElement.textContent = `${window.userData.totalClicks} 🪙`;
    }
    
    if (activityLevelElement) {
        const level = getActivityLevel(window.userData.totalClicks);
        activityLevelElement.textContent = level;
    }
}

// Определение уровня активности
function getActivityLevel(totalClicks) {
    if (totalClicks < 10) return 'Новичок';
    if (totalClicks < 50) return 'Активный';
    if (totalClicks < 100) return 'Опытный';
    if (totalClicks < 200) return 'Профессионал';
    if (totalClicks < 500) return 'Мастер';
    return 'Легенда';
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
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
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
    
    .method-card {
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .method-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 35px rgba(0,0,0,0.15);
    }
    
    .quick-button {
        transition: all 0.3s ease;
    }
    
    .quick-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(255, 154, 158, 0.5);
    }
    
    .quick-button:active {
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Ошибка на странице заработка:', e.error);
    showMessage('Произошла ошибка в приложении', 'error');
});

// Обработка unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Необработанная ошибка промиса:', e.reason);
    showMessage('Произошла ошибка в приложении', 'error');
});

// Обновление данных каждые 5 секунд
setInterval(() => {
    loadUserData();
    updateEarnDisplay();
}, 5000);
