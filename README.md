# Magnum Clicker - Telegram Web App

Зарабатывайте криптовалюту кликами в стиле Binance и Revolut!

## 🚀 Деплой на Vercel

### 1. Подготовка

1. Создайте аккаунт на [Vercel](https://vercel.com)
2. Создайте базу данных на [MongoDB Atlas](https://cloud.mongodb.com)
3. Создайте бота в [@BotFather](https://t.me/botfather)

### 2. Настройка переменных окружения

В Vercel Dashboard добавьте следующие переменные:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/magnum-star-bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### 3. Деплой

1. Подключите GitHub репозиторий к Vercel
2. Vercel автоматически определит Next.js проект
3. Деплой произойдет автоматически

### 4. Настройка Telegram Webhook

После деплоя выполните:

```bash
# Установите переменные окружения
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_WEBHOOK_URL="https://your-domain.vercel.app"

# Установите webhook
node scripts/set-webhook.js
```

## 🛠 Локальная разработка

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📱 Функциональность

- **Кликер**: Зарабатывайте монеты кликами
- **Кейсы**: Открывайте кейсы за награды
- **Энергия**: Система энергии с восстановлением
- **Уровни**: Повышайте уровень за клики
- **Баланс**: Отслеживайте Magnum Coins и Stars

## 🗄 База данных

### Модели

- **User**: Пользователи с балансом и статистикой
- **Case**: История открытых кейсов

### API Endpoints

- `GET /api/users?telegramId=123` - Получить данные пользователя
- `POST /api/users` - Создать/обновить пользователя
- `POST /api/click` - Обработать клик
- `POST /api/cases/open` - Открыть кейс
- `POST /api/telegram` - Webhook для Telegram бота

## 🎮 Игровая механика

### Клики
- 1 клик = 1 Magnum Coin + 0.0001 Star
- Тратит 1 энергию
- Восстановление: 1 энергия / 30 секунд

### Кейсы
- **Бронзовый**: 100 MC (50-200 монет, 0.001-0.01 звезд)
- **Серебряный**: 500 MC (300-800 монет, 0.01-0.05 звезд, 10-30 энергии)
- **Золотой**: 1000 MC (800-2000 монет, 0.05-0.15 звезд, 20-50 энергии)
- **Платиновый**: 5000 MC (3000-8000 монет, 0.1-0.5 звезд, 50-100 энергии)
- **Мифический**: 15000 MC (10000-25000 монет, 0.5-2.0 звезд, 100-200 энергии)

## 🔧 Технологии

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas
- **Bot**: Telegraf
- **Deployment**: Vercel

## 📄 Лицензия

MIT License
