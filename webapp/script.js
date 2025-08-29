// Инициализация Telegram WebApp
const tgApp = window.Telegram.WebApp;

// Устанавливаем цвета темы
document.documentElement.style.setProperty('--tg-theme-bg-color', tgApp.backgroundColor);
document.documentElement.style.setProperty('--tg-theme-text-color', tgApp.textColor);
document.documentElement.style.setProperty('--tg-theme-hint-color', tgApp.hintColor);
document.documentElement.style.setProperty('--tg-theme-link-color', tgApp.linkColor);
document.documentElement.style.setProperty('--tg-theme-button-color', tgApp.buttonColor);
document.documentElement.style.setProperty('--tg-theme-button-text-color', tgApp.buttonTextColor);

// Показываем WebApp
tgApp.expand();

// Получаем кнопку
const mainButton = document.getElementById('mainButton');

// Обработчик нажатия на кнопку
mainButton.addEventListener('click', () => {
    // Отправляем данные в бот
    tgApp.sendData(JSON.stringify({
        action: 'button_click',
        timestamp: Date.now()
    }));
    
    // Показываем уведомление
    tgApp.showPopup({
        title: 'Действие выполнено',
        message: 'Данные успешно отправлены в бот',
        buttons: [
            {id: 'ok', type: 'ok', text: 'OK'}
        ]
    });
});

// Обработка событий от Telegram WebApp
tgApp.onEvent('viewportChanged', () => {
    console.log('Viewport changed');
});

// Инициализация завершена
console.log('WebApp initialized');