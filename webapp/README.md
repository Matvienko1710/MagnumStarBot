# Magnum Stars WebApp

Telegram WebApp для бота Magnum Stars, созданный на React + TailwindCSS.

## 🚀 Возможности

- **Главная страница**: Большая кнопка "Клик" для заработка Stars
- **Баланс**: Отображение Stars и Magnum Coins в реальном времени
- **Навигация**: Таб-бар с переключением между страницами
- **Интеграция**: Синхронизация данных с Telegram ботом
- **Адаптивность**: Современный дизайн для всех устройств

## 🛠 Технологии

- **React 18** - Основной фреймворк
- **TailwindCSS** - Стилизация
- **React Router** - Навигация между страницами
- **Vite** - Сборка и разработка
- **Telegram WebApp API** - Интеграция с Telegram

## 📁 Структура проекта

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── Header.jsx      # Заголовок с балансом
│   ├── MainButton.jsx  # Главная кнопка клика
│   └── BottomNav.jsx   # Нижняя навигация
├── pages/              # Страницы приложения
│   ├── HomePage.jsx    # Главная страница
│   ├── TasksPage.jsx   # Страница заданий
│   └── EarnPage.jsx    # Страница заработка
├── context/            # React Context
│   └── TelegramContext.jsx  # Контекст Telegram WebApp
├── App.jsx             # Основной компонент
├── main.jsx            # Точка входа
└── index.css           # Основные стили
```

## 🚀 Запуск проекта

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```

### Сборка для продакшена
```bash
npm run build
```

### Предварительный просмотр сборки
```bash
npm run preview
```

## 🔧 Конфигурация

### Переменные окружения
Создайте файл `.env.local` в корне проекта:

```env
VITE_TELEGRAM_BOT_TOKEN=your_bot_token
VITE_API_BASE_URL=http://localhost:3001/api
```

### TailwindCSS
Конфигурация находится в `tailwind.config.js` с кастомными цветами:
- `telegram-blue` - Основной цвет Telegram
- `magnum-gold` - Золотой цвет для Stars
- `magnum-purple` - Фиолетовый цвет для Coins

## 📱 Интеграция с Telegram

### Инициализация WebApp
```javascript
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp
  tg.ready()
  tg.expand()
}
```

### Получение данных пользователя
```javascript
const user = tg.initDataUnsafe?.user
const userId = user?.id
```

### Отправка данных в бот
```javascript
await fetch('/api/user/click', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, amount: 1 })
})
```

## 🎨 Компоненты

### Header
Отображает:
- Аватар пользователя
- Имя и ID
- Баланс Stars и Magnum Coins

### MainButton
Функциональность:
- Анимированная кнопка клика
- Увеличение баланса на +1 Star
- Визуальные эффекты при нажатии
- Счетчик кликов

### BottomNav
Навигация:
- Главная страница (🏠)
- Задания (📋)
- Заработать ⭐️ (💰)

## 📊 Страницы

### HomePage
- Главная кнопка клика
- Инструкции по использованию
- Статистика

### TasksPage
- Заглушка для системы заданий
- Планируемые функции
- Временные карточки

### EarnPage
- Заглушка для способов заработка
- Планируемые функции
- Статистика заработка

## 🔄 Синхронизация с ботом

### API Endpoints
- `GET /api/user/balance?userId={id}` - Получение баланса
- `POST /api/user/click` - Обновление баланса при клике

### Локальное хранение
- Баланс сохраняется в `localStorage`
- Синхронизация при загрузке страницы
- Fallback на локальные данные при недоступности API

## 🎯 Планируемые функции

### Задания
- Ежедневные задания
- Еженедельные вызовы
- Специальные события
- Реферальные программы

### Заработок
- Просмотр рекламы
- Мини-игры
- Турниры
- Ежедневные бонусы

## 🚀 Развертывание

### Render
1. Подключите GitHub репозиторий
2. Установите переменные окружения
3. Команда сборки: `npm run build`
4. Папка сборки: `dist`

### Vercel
1. Импортируйте проект
2. Настройте переменные окружения
3. Автоматическое развертывание

## 🐛 Отладка

### Логирование
```javascript
console.log('Telegram WebApp:', window.Telegram?.WebApp)
console.log('User data:', tg.initDataUnsafe?.user)
```

### Проверка API
```bash
curl -X GET "http://localhost:3001/api/user/balance?userId=123"
```

## 📝 Лицензия

MIT License - свободное использование и модификация.

## 🤝 Поддержка

По вопросам разработки обращайтесь к команде Magnum Stars.
