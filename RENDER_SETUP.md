# 🚀 Настройка Render для Magnum Star Bot

## 📋 **Необходимые переменные окружения**

### 1. **BOT_TOKEN** (Обязательно)
- **Описание**: Токен вашего Telegram бота от @BotFather
- **Формат**: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
- **Как получить**: 
  1. Напишите @BotFather в Telegram
  2. Создайте нового бота: `/newbot`
  3. Скопируйте токен

### 2. **MONGODB_URI** (Обязательно)
- **Описание**: URI для подключения к MongoDB Atlas
- **Формат**: `mongodb+srv://username:password@cluster.mongodb.net/database`
- **Текущее значение**: `mongodb+srv://magnumstar:Indesi474848@cluster0.flbhe9f.mongodb.net/?retryWrites=true&w=majority`

### 3. **NODE_ENV** (Автоматически)
- **Описание**: Окружение выполнения
- **Значение**: `production` (устанавливается автоматически)

## 🔧 **Пошаговая настройка в Render**

### **Шаг 1: Откройте настройки сервиса**
1. Войдите в [Render Dashboard](https://dashboard.render.com)
2. Найдите ваш сервис `magnum-star-bot`
3. Нажмите на название сервиса

### **Шаг 2: Перейдите в Environment**
1. В левом меню выберите **Environment**
2. Нажмите **Add Environment Variable**

### **Шаг 3: Добавьте BOT_TOKEN**
```
Key: BOT_TOKEN
Value: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```
⚠️ **Важно**: Замените на ваш реальный токен!

### **Шаг 4: Проверьте MONGODB_URI**
```
Key: MONGODB_URI
Value: mongodb+srv://magnumstar:Indesi474848@cluster0.flbhe9f.mongodb.net/?retryWrites=true&w=majority
```

### **Шаг 5: Сохраните и перезапустите**
1. Нажмите **Save Changes**
2. Перейдите в **Manual Deploy**
3. Нажмите **Deploy latest commit**

## 🚨 **Проблемы и решения**

### **Ошибка: "MONGODB_URI не установлена"**
**Причина**: Переменная окружения не установлена в Render
**Решение**: 
1. Проверьте настройки Environment в Render
2. Убедитесь, что MONGODB_URI добавлена
3. Перезапустите сервис

### **Ошибка: "Bot launch failed"**
**Причина**: BOT_TOKEN не установлен или неверный
**Решение**:
1. Проверьте токен бота
2. Убедитесь, что BOT_TOKEN добавлен в Environment
3. Перезапустите сервис

### **Ошибка: "SSL routines" при подключении к MongoDB**
**Причина**: Проблемы с SSL/TLS на Render
**Решение**: 
1. Бот автоматически попробует разные конфигурации
2. Если не поможет, проверьте настройки MongoDB Atlas

## 📊 **Проверка работоспособности**

### **Health Check**
```
https://magnumstarbot.onrender.com/api/health
```

### **Статистика кэша**
```
https://magnumstarbot.onrender.com/api/cache/stats
```

### **Очистка кэша**
```bash
curl -X POST https://magnumstarbot.onrender.com/api/cache/clear
```

## 🔐 **Безопасность**

- ✅ **НЕ добавляйте** токены в код
- ✅ **Используйте** переменные окружения
- ✅ **Регулярно обновляйте** пароли
- ✅ **Ограничьте доступ** к MongoDB Atlas

## 📞 **Поддержка**

Если возникли проблемы:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные установлены
3. Проверьте статус MongoDB Atlas
4. Обратитесь к документации Render
