# 🤖 Настройка Telegram бота

## 📋 Что нужно сделать:

### 1. Создать бота в Telegram
1. Напишите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните **Bot Token**

### 2. Настроить переменные окружения в Vercel
В панели Vercel добавьте следующие переменные:

```
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_WEBHOOK_URL=https://ваш-домен.vercel.app/api/telegram
NEXTAUTH_URL=https://ваш-домен.vercel.app
NEXTAUTH_SECRET=случайная_строка_для_безопасности
MONGODB_URI=ваша_строка_подключения_mongodb (опционально)
```

### 3. Настроить webhook
После деплоя выполните команду:
```bash
npm run setup-webhook
```

Или вручную отправьте POST запрос:
```
POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
Content-Type: application/json

{
  "url": "https://ваш-домен.vercel.app/api/telegram",
  "allowed_updates": ["message", "callback_query"]
}
```

### 4. Проверить работу
1. Найдите вашего бота в Telegram
2. Отправьте команду `/start`
3. Должно появиться приветственное сообщение с кнопкой "🎮 Play Game"

## 🔧 Устранение проблем

### Бот не отвечает на /start
- Проверьте, что webhook настроен правильно
- Убедитесь, что переменные окружения установлены в Vercel
- Проверьте логи в Vercel Dashboard

### Кнопка не открывает веб-приложение
- Убедитесь, что `NEXTAUTH_URL` указан правильно
- Проверьте, что веб-приложение доступно по указанному URL

## 📱 Тестирование
1. Откройте бота в Telegram
2. Отправьте `/start` - должно появиться приветствие
3. Нажмите "🎮 Play Game" - должно открыться веб-приложение
4. Протестируйте игру (клики, кейсы, баланс)
