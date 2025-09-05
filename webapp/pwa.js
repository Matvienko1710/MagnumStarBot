// PWA functionality for MagnumStarBot WebApp
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker зарегистрирован:', registration);
                
                // Запрашиваем разрешение на push-уведомления
                requestNotificationPermission();
            })
            .catch(error => {
                console.error('Ошибка регистрации Service Worker:', error);
            });
    }
}

// Запрос разрешения на уведомления
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            subscribeToPushNotifications();
        }
    }
}

// Подписка на push-уведомления
async function subscribeToPushNotifications() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY')
        });
        
        // Отправляем subscription на сервер
        await fetch('/api/push-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription)
        });
    } catch (error) {
        console.error('Ошибка подписки на push-уведомления:', error);
    }
}

// Показываем индикатор загрузки
function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loading';
    loader.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loader);
}

// Скрываем индикатор загрузки
function hideLoading() {
    const loader = document.querySelector('.loading');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 300);
    }
}

// Обработка ошибок с анимацией
function handleError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message fade-in';
    errorDiv.textContent = message;
    
    // Добавляем анимацию тряски
    errorDiv.classList.add('shake');
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        errorDiv.classList.add('fade-out');
        setTimeout(() => errorDiv.remove(), 300);
    }, 5000);
    
    document.body.appendChild(errorDiv);
}

// Вспомогательная функция для VAPID ключа
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
}

// Регистрируем Service Worker при загрузке
registerServiceWorker();
