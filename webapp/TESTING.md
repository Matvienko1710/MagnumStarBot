# 🧪 Тестирование WebApp

## 🚀 Быстрый тест

### 1. Запуск сервера
```bash
cd webapp
npm start
```

### 2. Тестирование

#### **HTML WebApp:**
- **URL:** `http://localhost:3000/`
- **Что тестировать:** Простой HTML WebApp с кнопкой клика
- **Ожидаемый результат:** Рабочая кнопка клика, счетчик, LocalStorage, навигация

## 🔍 Диагностика проблем

### **Черный экран:**
1. Откройте консоль браузера (F12)
2. Проверьте ошибки JavaScript
3. Попробуйте простую версию `/simple.html`

### **Ошибки загрузки ресурсов:**
1. Проверьте, что папка `dist` существует
2. Убедитесь, что файлы CSS и JS есть в `dist/assets/`
3. Проверьте пути в `index.html`

### **Проблемы с LocalStorage:**
1. Используйте кнопку "Тест LocalStorage" на `/simple.html`
2. Проверьте настройки браузера
3. Убедитесь, что не включен режим инкогнито

## 📱 Тестирование в Telegram

### **Локально:**
- WebApp работает как обычный сайт
- Telegram API недоступен (это нормально)

### **В Telegram:**
- Откройте бота
- Нажмите кнопку "Magnum Star - Beta"
- WebApp должен загрузиться в Telegram

## 🛠 Отладка

### **Консоль браузера:**
```javascript
// Проверка Telegram WebApp
console.log('Telegram:', window.Telegram?.WebApp)

// Проверка LocalStorage
console.log('LocalStorage доступен:', !!localStorage)

// Проверка баланса
console.log('Баланс:', localStorage.getItem('magnum_stars_balance'))
```

### **Проверка файлов:**
```bash
# Проверка структуры
dir webapp\dist
dir webapp\dist\assets

# Проверка содержимого
type webapp\dist\index.html
```

## ✅ Чек-лист тестирования

- [ ] Сервер запускается без ошибок
- [ ] `/simple.html` загружается и работает
- [ ] Кнопка клика увеличивает счетчик
- [ ] Данные сохраняются в LocalStorage
- [ ] React версия загружается без ошибок
- [ ] Навигация между страницами работает
- [ ] Баланс отображается корректно
- [ ] Нет ошибок в консоли браузера

## 🚨 Частые проблемы

### **1. "Cannot find module"**
- Выполните `npm install` в папке `webapp`
- Пересоберите: `npm run build`

### **2. "Failed to load resource"**
- Проверьте пути в `index.html`
- Убедитесь, что файлы существуют в `dist/assets/`

### **3. "Telegram is not defined"**
- Это нормально при локальном тестировании
- В Telegram WebApp будет доступен

### **4. "React is not defined"**
- Проверьте, что `main.jsx` импортирует правильный компонент
- Пересоберите проект: `npm run build`

## 🎯 Следующие шаги

После успешного тестирования:
1. Разверните на Render как **Web Service**
2. Обновите `WEBAPP_URL` в настройках бота
3. Протестируйте в реальном Telegram WebApp

## 🚀 Деплой на Render (Web Service)

### **Настройки Render:**
- **Тип сервиса:** Web Service (НЕ Static Site!)
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** Node
- **Port:** 10000 (или оставьте пустым для автоопределения)

### **Переменные окружения:**
- **MONGODB_URI:** URI для подключения к MongoDB (должен совпадать с ботом)

### **Что происходит:**
1. Render устанавливает зависимости (`npm install`)
2. Запускает Express сервер (`npm start`)
3. Сервер подключается к MongoDB
4. API работает с теми же данными, что и бот
5. WebApp доступен по URL Render

## 🔌 API Endpoints

### **Получение баланса:**
- **GET** `/api/user/balance/:userId`
- **Ответ:** `{ success: true, balance: { stars: 100, coins: 500 } }`

### **Клик по кнопке:**
- **POST** `/api/user/click/:userId`
- **Ответ:** `{ success: true, message: "Баланс обновлен!", balance: {...} }`

### **Статистика пользователя:**
- **GET** `/api/user/stats/:userId`
- **Ответ:** `{ success: true, stats: { totalTransactions: 10, todayClicks: 5 } }`

### **Информация о пользователе:**
- **GET** `/api/user/info/:userId`
- **Ответ:** `{ success: true, user: { userId: 123, firstName: "Имя", balance: {...} } }`
