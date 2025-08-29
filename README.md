# Magnum Star Bot

Telegram бот с поддержкой WebApp интерфейса.

## Структура проекта

```
magnum_bot/ 
 │ 
 ├── bot/                      # код бота 
 │   ├── index.js              # инициализация бота 
 │   ├── handlers/             # обработчики 
 │   │   ├── start.js 
 │   │   ├── info.js 
 │   │   └── callback.js 
 │   └── keyboards/            # кнопки 
 │       ├── mainMenu.js 
 │       └── inline.js 
 │ 
 ├── webapp/                   # фронтенд для WebApp 
 │   ├── index.html 
 │   ├── style.css 
 │   └── script.js 
 │ 
 ├── server.js                 # Express сервер + запуск бота 
 ├── package.json 
 ├── .env                      # токен и конфиг 
 └── README.md
```

## Установка и запуск

1. Клонируйте репозиторий
2. Установите зависимости:
   ```
   npm install
   ```
3. Создайте файл `.env` и укажите в нем:
   ```
   BOT_TOKEN=ваш_токен_от_BotFather
   PORT=3000
   WEBAPP_URL=https://ваш_домен.com
   ```
4. Запустите бота:
   ```
   npm start
   ```

## Разработка

Для запуска в режиме разработки с автоматической перезагрузкой:
```
npm run dev
```

## Функциональность

- Обработка команд Telegram бота
- Интерактивные кнопки и меню
- WebApp интерфейс для расширенного взаимодействия
- Express сервер для хостинга WebApp и API

## Технологии

- Node.js
- Telegraf.js
- Express
- HTML/CSS/JavaScript

## Деплой на Render.com

### Подготовка к деплою

1. Убедитесь, что у вас есть аккаунт на [Render.com](https://render.com)
2. Загрузите код в GitHub репозиторий

### Шаги для деплоя

1. В Dashboard Render нажмите "New" и выберите "Web Service"
2. Подключите ваш GitHub репозиторий
3. Настройте сервис:
   - **Name**: magnum-star-bot (или любое другое имя)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (или другой по вашему выбору)

4. Настройте переменные окружения во вкладке "Environment":
   - `BOT_TOKEN` - токен вашего Telegram бота
   - `WEBAPP_URL` - URL вашего приложения на Render (например, https://magnum-star-bot.onrender.com)
   - `PORT` - оставьте пустым, Render установит его автоматически

5. Нажмите "Create Web Service"

### Альтернативный способ с Blueprint

Вы также можете использовать файл `render.yaml` для автоматического деплоя:

1. Перейдите в Dashboard Render
2. Нажмите "New" и выберите "Blueprint"
3. Подключите ваш GitHub репозиторий
4. Render автоматически обнаружит файл `render.yaml` и настроит сервис

Подробные инструкции по настройке переменных окружения можно найти в файле `render-env-setup.md`.