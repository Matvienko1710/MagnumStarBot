# 🚀 Настройка Magnum Star Bot на Render

## 📋 Необходимые переменные окружения

### 1. BOT_TOKEN
- **Key:** `BOT_TOKEN`
- **Value:** Ваш токен от @BotFather
- **Пример:** `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. MONGODB_URI
- **Key:** `MONGODB_URI`
- **Value:** URI подключения к MongoDB Atlas
- **Пример:** `mongodb+srv://username:password@cluster.mongodb.net/database`

## 🔧 Как установить переменные на Render

1. **Перейдите в ваш сервис на Render**
2. **Нажмите на название сервиса**
3. **Перейдите в раздел "Environment"**
4. **Нажмите "Add Environment Variable"**
5. **Добавьте каждую переменную:**

### BOT_TOKEN
```
Key: BOT_TOKEN
Value: ваш_токен_от_botfather
```

### MONGODB_URI
```
Key: MONGODB_URI
Value: ваш_uri_от_mongodb_atlas
```

## ✅ Проверка подключения

После установки переменных:
1. **Перезапустите сервис** (Redeploy)
2. **Проверьте логи** на наличие сообщения "✅ База данных успешно подключена"
3. **Проверьте health check** по адресу `/api/health`

## 🆘 Если что-то не работает

1. **Проверьте правильность URI** - он должен начинаться с `mongodb+srv://`
2. **Убедитесь, что IP адрес Render разрешен** в MongoDB Atlas
3. **Проверьте логи** на наличие ошибок подключения
4. **Убедитесь, что переменные установлены** и сервис перезапущен

## 📝 Примеры URI MongoDB Atlas

```
mongodb+srv://username:password@cluster.mongodb.net/database
mongodb+srv://magnumstar:mypassword@cluster0.abc123.mongodb.net/magnumstars
```

## 🔒 Безопасность

- **Никогда не коммитьте** токены и пароли в Git
- **Используйте переменные окружения** Render
- **Регулярно обновляйте** пароли и токены
