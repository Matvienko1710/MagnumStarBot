# Переменные окружения для Magnum Stars Bot

## 📋 Обязательные переменные

### Telegram Bot
```
BOT_TOKEN=your_telegram_bot_token_here
```
Получите токен у [@BotFather](https://t.me/botfather) в Telegram

### База данных
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```
Создайте кластер в [MongoDB Atlas](https://cloud.mongodb.com/) и получите connection string

## 🌐 WebApp
```
WEBAPP_URL=https://magnumstarbot.onrender.com
```
URL вашего развернутого веб-приложения

## 🔗 Социальные ссылки (Telegram каналы/чаты)

**Формат:** Указывайте ТОЛЬКО название канала/чата без `@` или `https://t.me/`

### Примеры настроек:
```
# Правильно ✅
CHAT_URL=magnumtapchat
NEWS_URL=magnumnews
PAYMENTS_URL=magnumpayments

# Неправильно ❌
CHAT_URL=@magnumtapchat
CHAT_URL=https://t.me/magnumtapchat
```

### Как настроить:
1. Создайте каналы/чаты в Telegram
2. Получите их username (название после @)
3. Укажите только эту часть в переменных окружения
4. Код автоматически сформирует правильные ссылки: `https://t.me/ВАШ_USERNAME`

## 👑 Админ настройки
```
ADMIN_USER_IDS=123456789,987654321
```
ID пользователей Telegram, которые будут админами (через запятую)

## ⚙️ Системные настройки
```
NODE_ENV=development
PORT=3000
```

## 🚀 Настройка на Render

В панели управления Render перейдите в:
**Dashboard → Your Service → Environment**

Добавьте следующие переменные:

| Variable | Value | Description |
|----------|-------|-------------|
| `BOT_TOKEN` | `ваш_токен_бота` | Токен от BotFather |
| `MONGODB_URI` | `ваша_mongodb_uri` | Connection string из MongoDB Atlas |
| `WEBAPP_URL` | `https://ваш_проект.onrender.com` | URL вашего приложения |
| `CHAT_URL` | `magnumtapchat` | Название чата (без @) |
| `NEWS_URL` | `magnumnews` | Название канала новостей (без @) |
| `PAYMENTS_URL` | `magnumpayments` | Название канала выплат (без @) |
| `ADMIN_USER_IDS` | `ваш_telegram_id` | Ваш Telegram ID |

## 🔍 Как узнать свой Telegram ID

1. Напишите боту [@userinfobot](https://t.me/userinfobot)
2. Он покажет ваш ID
3. Добавьте его в `ADMIN_USER_IDS`

## ✅ Проверка настроек

После настройки переменных окружения:
1. Перезапустите сервис на Render
2. Проверьте работу кнопок в главном меню
3. Убедитесь, что ссылки ведут на правильные каналы
