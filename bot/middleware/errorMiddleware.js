// Middleware для обработки ошибок

// Middleware для логирования запросов
const requestLogger = (ctx, next) => {
  const start = Date.now();
  const userId = ctx.from?.id || 'unknown';
  const updateType = ctx.updateType || 'unknown';
  
  console.log(`[${new Date().toISOString()}] Request from user ${userId}, type: ${updateType}`);
  
  return next().finally(() => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Request completed for user ${userId} in ${duration}ms`);
  });
};

// Middleware для валидации контекста
const contextValidator = (ctx, next) => {
  // Проверяем наличие необходимых данных
  if (!ctx.from || !ctx.from.id) {
    console.error('[Context Error] Missing user data in context');
    throw new Error('Некорректные данные пользователя');
  }
  
  // Проверяем тип чата
  if (ctx.chat && ctx.chat.type !== 'private') {
    console.warn(`[Context Warning] Non-private chat detected: ${ctx.chat.type}`);
  }
  
  return next();
};

// Middleware для обработки rate limiting
const rateLimiter = new Map();
const rateLimitMiddleware = (ctx, next) => {
  const userId = ctx.from?.id;
  const now = Date.now();
  const windowMs = 60000; // 1 минута
  const maxRequests = 30; // максимум 30 запросов в минуту
  
  if (!rateLimiter.has(userId)) {
    rateLimiter.set(userId, { count: 0, resetTime: now + windowMs });
  }
  
  const userLimit = rateLimiter.get(userId);
  
  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + windowMs;
  }
  
  if (userLimit.count >= maxRequests) {
    console.warn(`[Rate Limit] User ${userId} exceeded rate limit`);
    throw new Error('Слишком много запросов. Попробуйте позже.');
  }
  
  userLimit.count++;
  return next();
};

// Middleware для очистки старых записей rate limiter
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of rateLimiter.entries()) {
    if (now > data.resetTime) {
      rateLimiter.delete(userId);
    }
  }
}, 300000); // очистка каждые 5 минут

// Middleware для обработки состояний пользователей
const stateManager = (ctx, next) => {
  const userId = ctx.from?.id;
  
  // Добавляем информацию о состоянии в контекст
  ctx.userState = {
    userId,
    timestamp: Date.now(),
    updateType: ctx.updateType
  };
  
  return next();
};

// Middleware для мониторинга производительности
const performanceMonitor = (ctx, next) => {
  const start = process.hrtime.bigint();
  
  return next().finally(() => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // в миллисекундах
    
    if (duration > 1000) { // если обработка заняла больше 1 секунды
      console.warn(`[Performance] Slow operation detected: ${duration.toFixed(2)}ms for user ${ctx.from?.id}`);
    }
  });
};

// Middleware для обработки ошибок в middleware
const errorHandlerMiddleware = (ctx, next) => {
  return next().catch((error) => {
    const userId = ctx.from?.id || 'unknown';
    console.error(`[Middleware Error] User ${userId}:`, error.message);
    
    // Отправляем сообщение пользователю только если это возможно
    if (ctx.reply && ctx.chat?.type === 'private') {
      ctx.reply(
        '❌ Произошла ошибка при обработке запроса.\n\n' +
        '🔄 Попробуйте еще раз или используйте /start для перезапуска бота.'
      ).catch(replyError => {
        console.error(`[Middleware Error] Failed to send error message to user ${userId}:`, replyError.message);
      });
    }
    
    throw error; // Перебрасываем ошибку дальше
  });
};

module.exports = {
  requestLogger,
  contextValidator,
  rateLimitMiddleware,
  stateManager,
  performanceMonitor,
  errorHandlerMiddleware
};
