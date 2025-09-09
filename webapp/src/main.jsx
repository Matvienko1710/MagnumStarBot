import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW: Регистрация успешна:', registration.scope);
        
        // Обновление SW
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 SW: Доступно обновление');
              // Можно показать уведомление пользователю об обновлении
            }
          });
        });
      })
      .catch((error) => {
        console.log('❌ SW: Ошибка регистрации:', error);
      });
  });
}

// Обработка изменений в сетевом подключении
window.addEventListener('online', () => {
  console.log('🌐 Подключение к интернету восстановлено');
});

window.addEventListener('offline', () => {
  console.log('📡 Подключение к интернету потеряно');
});

// Оптимизация для мобильных устройств
if (window.Telegram?.WebApp) {
  const webApp = window.Telegram.WebApp;
  
  // Настройки для лучшей работы на мобильных
  webApp.ready();
  webApp.expand();
  
  // Отключение вертикальных свайпов (если нужно)
  webApp.disableVerticalSwipes();
  
  // Установка цвета темы
  webApp.setHeaderColor('#22223B');
  webApp.setBackgroundColor('#22223B');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
