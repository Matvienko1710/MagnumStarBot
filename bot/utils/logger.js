const fs = require('fs');
const path = require('path');

// Создаем папку для логов, если её нет
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Функция для получения текущего времени в читаемом формате
const getTimestamp = () => {
  return new Date().toISOString();
};

// Функция для логирования
const log = (level, message, data = null, error = null) => {
  const timestamp = getTimestamp();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    data,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : null
  };

  // Форматируем лог для консоли
  let consoleMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  if (data) {
    consoleMessage += ` | Data: ${JSON.stringify(data, null, 2)}`;
  }
  if (error) {
    consoleMessage += ` | Error: ${error.message}`;
  }

  // Выводим в консоль
  console.log(consoleMessage);

  // Записываем в файл
  const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
  const logLine = JSON.stringify(logEntry) + '\n';
  
  try {
    fs.appendFileSync(logFile, logLine);
  } catch (writeError) {
    console.error('Ошибка записи в лог файл:', writeError.message);
  }
};

// Основные функции логирования
const logger = {
  // Информационное сообщение
  info: (message, data = null) => {
    log('info', message, data);
  },

  // Предупреждение
  warn: (message, data = null) => {
    log('warn', message, data);
  },

  // Ошибка
  error: (message, error = null, data = null) => {
    log('error', message, data, error);
  },

  // Отладка
  debug: (message, data = null) => {
    log('debug', message, data);
  },

  // Логирование входящих запросов
  request: (method, path, data = null) => {
    log('info', `REQUEST: ${method} ${path}`, data);
  },

  // Логирование исходящих ответов
  response: (method, path, statusCode, data = null) => {
    log('info', `RESPONSE: ${method} ${path} - ${statusCode}`, data);
  },

  // Логирование функций
  function: (functionName, params = null, result = null) => {
    log('debug', `FUNCTION: ${functionName}`, { params, result });
  },

  // Логирование состояний пользователя
  userState: (userId, action, state = null) => {
    log('debug', `USER_STATE: User ${userId} - ${action}`, state);
  },

  // Логирование транзакций
  transaction: (type, userId, amount, currency, details = null) => {
    log('info', `TRANSACTION: ${type}`, { userId, amount, currency, details });
  },

  // Логирование ошибок с контекстом
  errorWithContext: (message, error, context = null) => {
    log('error', message, context, error);
  }
};

module.exports = logger;
