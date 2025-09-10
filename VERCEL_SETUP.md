# 🚀 Настройка деплоя на Vercel

## 📋 Предварительные требования

1. **Аккаунт Vercel** - зарегистрируйтесь на [vercel.com](https://vercel.com)
2. **GitHub репозиторий** - код должен быть в GitHub
3. **MongoDB Atlas** - база данных MongoDB
4. **Telegram Bot Token** - от @BotFather

## 🔧 Переменные окружения

В настройках проекта Vercel добавьте следующие переменные:

### Обязательные переменные:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/magnumstar
BOT_TOKEN=your_telegram_bot_token
WEBAPP_URL=https://your-project.vercel.app
```

### Опциональные переменные:
```
NODE_ENV=production
PORT=3000
```

## 🚀 Процесс деплоя

### 1. Подключение репозитория
1. Войдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Нажмите "New Project"
3. Выберите ваш GitHub репозиторий
4. Нажмите "Import"

### 2. Настройка проекта
1. **Framework Preset**: Other
2. **Root Directory**: оставьте пустым
3. **Build Command**: `npm run vercel-build`
4. **Output Directory**: `webapp/dist`
5. **Install Command**: `npm install`

### 3. Переменные окружения
1. В настройках проекта перейдите в "Environment Variables"
2. Добавьте все необходимые переменные
3. Убедитесь, что они доступны для Production

### 4. Деплой
1. Нажмите "Deploy"
2. Дождитесь завершения сборки
3. Получите URL вашего проекта

## 📁 Структура проекта

```
├── api/                    # API routes для Vercel
│   ├── index.js           # Главный API handler
│   ├── balance.js         # Баланс пользователей
│   ├── click.js           # Клики
│   ├── reward.js          # Награды
│   ├── recent-wins.js     # Последние выигрыши
│   └── shared/            # Общие модули
│       └── balanceStore.js
├── webapp/                # Frontend приложение
│   ├── src/              # Исходный код React
│   ├── dist/             # Собранное приложение
│   └── package.json      # Зависимости frontend
├── bot/                   # Telegram бот
├── vercel.json           # Конфигурация Vercel
└── package.json          # Зависимости backend
```

## 🔄 Настройка webhook для бота

После деплоя на Vercel:

1. **Установите webhook:**
   ```bash
   npm run set-webhook
   ```

2. **Проверьте webhook:**
   - Перейдите на `https://your-project.vercel.app/api/bot/health`
   - Должен вернуться статус OK

3. **Если нужно удалить webhook:**
   ```bash
   npm run delete-webhook
   ```

## 🤖 Локальная разработка бота

Для локальной разработки используйте polling:

```bash
# Удалите webhook
npm run delete-webhook

# Запустите бота локально
npm run dev
```

## 🐛 Отладка

### Логи Vercel:
1. Перейдите в Functions в панели Vercel
2. Выберите функцию `api/index.js`
3. Просматривайте логи в реальном времени

### Локальная разработка:
```bash
# Установка Vercel CLI
npm i -g vercel

# Локальный запуск
vercel dev
```

## 📊 Мониторинг

- **Vercel Analytics** - встроенная аналитика
- **Vercel Speed Insights** - производительность
- **Function Logs** - логи API функций

## 🔒 Безопасность

- Все API routes защищены CORS
- Используется Helmet для безопасности
- Переменные окружения скрыты
- MongoDB подключение через SSL

## 💡 Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Telegram Bot API](https://core.telegram.org/bots/api)
