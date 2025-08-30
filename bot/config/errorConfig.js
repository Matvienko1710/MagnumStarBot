// Конфигурация для обработки ошибок

const errorConfig = {
  // Настройки логирования
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'error', // 'debug', 'info', 'warn', 'error'
    includeStack: true,
    includeTimestamp: true,
    includeUserId: true
  },

  // Настройки rate limiting
  rateLimit: {
    enabled: true,
    windowMs: 60000, // 1 минута
    maxRequests: 30, // максимум запросов в окне
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Настройки восстановления после ошибок
  recovery: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000, // 1 секунда
    autoCleanup: true,
    cleanupInterval: 300000 // 5 минут
  },

  // Настройки мониторинга производительности
  performance: {
    enabled: true,
    slowOperationThreshold: 1000, // 1 секунда
    logSlowOperations: true,
    trackMemoryUsage: false
  },

  // Настройки уведомлений об ошибках
  notifications: {
    enabled: false, // можно включить для отправки уведомлений админам
    adminIds: [], // ID администраторов для уведомлений
    criticalErrorThreshold: 5, // количество критических ошибок для уведомления
    notificationCooldown: 300000 // 5 минут между уведомлениями
  },

  // Настройки валидации
  validation: {
    enabled: true,
    strictMode: false, // строгий режим валидации
    validateUserId: true,
    validateAmount: true,
    validateKey: true,
    validateReferralCode: true
  },

  // Настройки graceful shutdown
  gracefulShutdown: {
    enabled: true,
    timeout: 10000, // 10 секунд на завершение
    saveState: true,
    cleanupResources: true
  },

  // Сообщения об ошибках
  messages: {
    general: '❌ Произошла ошибка при обработке запроса.\n\n🔄 Попробуйте еще раз или используйте /menu для возврата в главное меню.',
    critical: '🚨 Произошла критическая ошибка в боте.\n\n🔄 Попробуйте перезапустить бота командой /start',
    rateLimit: '⏰ Слишком много запросов. Попробуйте позже.',
    validation: '❌ Некорректные данные. Проверьте введенную информацию.',
    network: '🌐 Ошибка сети. Проверьте подключение к интернету.',
    timeout: '⏱️ Превышено время ожидания. Попробуйте еще раз.',
    permission: '🚫 Недостаточно прав для выполнения операции.',
    maintenance: '🔧 Бот находится на техническом обслуживании. Попробуйте позже.'
  },

  // Коды ошибок
  errorCodes: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    CRITICAL_ERROR: 'CRITICAL_ERROR',
    MAINTENANCE_ERROR: 'MAINTENANCE_ERROR'
  }
};

// Функция для получения сообщения об ошибке по коду
const getErrorMessage = (code, customMessage = '') => {
  if (customMessage) {
    return customMessage;
  }
  
  return errorConfig.messages[code] || errorConfig.messages.general;
};

// Функция для проверки, включена ли функция
const isFeatureEnabled = (feature) => {
  return errorConfig[feature]?.enabled || false;
};

// Функция для получения настройки
const getConfig = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], errorConfig);
};

module.exports = {
  errorConfig,
  getErrorMessage,
  isFeatureEnabled,
  getConfig
};
