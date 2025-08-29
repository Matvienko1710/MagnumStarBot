// Система заданий для заработка Stars и Magnum Coins

const { giveReward } = require('./currency');

// Временное хранилище данных (в реальном проекте заменить на БД)
const userTasks = new Map();
const taskProgress = new Map();

// Типы заданий
const TASK_TYPES = {
  DAILY_LOGIN: {
    id: 'daily_login',
    name: 'Ежедневный вход',
    description: 'Заходите в бота каждый день',
    reward: { stars: 1, coins: 0 },
    maxCompletions: 1,
    resetPeriod: 'daily', // daily, weekly, monthly, once
    requirements: []
  },
  
  REFERRAL_INVITE: {
    id: 'referral_invite',
    name: 'Пригласить друга',
    description: 'Пригласите друга по реферальной ссылке',
    reward: { stars: 5, coins: 0 },
    maxCompletions: Infinity,
    resetPeriod: 'once',
    requirements: []
  },
  
  WEBAPP_USAGE: {
    id: 'webapp_usage',
    name: 'Использовать WebApp',
    description: 'Откройте и используйте WebApp',
    reward: { stars: 2, coins: 0 },
    maxCompletions: 1,
    resetPeriod: 'once',
    requirements: []
  },
  
  FIRST_TASK: {
    id: 'first_task',
    name: 'Первое задание',
    description: 'Выполните любое задание',
    reward: { stars: 3, coins: 10 },
    maxCompletions: 1,
    resetPeriod: 'once',
    requirements: []
  },
  
  WEEKLY_BONUS: {
    id: 'weekly_bonus',
    name: 'Недельный бонус',
    description: 'Выполните 7 ежедневных входов подряд',
    reward: { stars: 10, coins: 50 },
    maxCompletions: 1,
    resetPeriod: 'weekly',
    requirements: ['daily_login']
  },
  
  BALANCE_MILESTONE: {
    id: 'balance_milestone',
    name: 'Достижение баланса',
    description: 'Накопите 100 Stars',
    reward: { stars: 5, coins: 25 },
    maxCompletions: 1,
    resetPeriod: 'once',
    requirements: []
  }
};

// Инициализация заданий пользователя
const initializeUserTasks = (userId) => {
  if (!userTasks.has(userId)) {
    userTasks.set(userId, {});
  }
  
  if (!taskProgress.has(userId)) {
    taskProgress.set(userId, {});
  }
  
  // Инициализируем все задания
  Object.keys(TASK_TYPES).forEach(taskKey => {
    const task = TASK_TYPES[taskKey];
    if (!userTasks.get(userId)[task.id]) {
      userTasks.get(userId)[task.id] = {
        completed: 0,
        lastCompleted: null,
        lastReset: new Date(),
        isActive: true
      };
    }
  });
  
  return userTasks.get(userId);
};

// Получение заданий пользователя
const getUserTasks = (userId) => {
  return initializeUserTasks(userId);
};

// Проверка возможности выполнения задания
const canCompleteTask = (userId, taskId) => {
  const userTaskData = getUserTasks(userId);
  const task = Object.values(TASK_TYPES).find(t => t.id === taskId);
  
  if (!task || !userTaskData[taskId]) {
    return { canComplete: false, reason: 'Задание не найдено' };
  }
  
  const taskData = userTaskData[taskId];
  
  // Проверяем лимит выполнений
  if (taskData.completed >= task.maxCompletions) {
    return { canComplete: false, reason: 'Достигнут лимит выполнений' };
  }
  
  // Проверяем период сброса
  if (task.resetPeriod !== 'once') {
    const now = new Date();
    const lastReset = new Date(taskData.lastReset);
    
    if (task.resetPeriod === 'daily') {
      const daysDiff = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
      if (daysDiff < 1) {
        return { canComplete: false, reason: 'Задание уже выполнено сегодня' };
      }
    } else if (task.resetPeriod === 'weekly') {
      const weeksDiff = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24 * 7));
      if (weeksDiff < 1) {
        return { canComplete: false, reason: 'Задание уже выполнено на этой неделе' };
      }
    }
  }
  
  // Проверяем требования
  for (const requirement of task.requirements) {
    const requirementTask = userTaskData[requirement];
    if (!requirementTask || requirementTask.completed === 0) {
      return { canComplete: false, reason: `Требуется выполнить: ${requirement}` };
    }
  }
  
  return { canComplete: true };
};

// Выполнение задания
const completeTask = (userId, taskId) => {
  const check = canCompleteTask(userId, taskId);
  if (!check.canComplete) {
    throw new Error(check.reason);
  }
  
  const task = Object.values(TASK_TYPES).find(t => t.id === taskId);
  const userTaskData = getUserTasks(userId);
  const taskData = userTaskData[taskId];
  
  // Обновляем прогресс
  taskData.completed += 1;
  taskData.lastCompleted = new Date();
  
  // Сбрасываем счетчик если нужно
  if (task.resetPeriod !== 'once') {
    taskData.lastReset = new Date();
  }
  
  // Выдаем награду
  const rewardResult = giveReward(userId, taskId.toUpperCase());
  
  return {
    taskId,
    taskName: task.name,
    completed: taskData.completed,
    reward: rewardResult,
    nextReset: taskData.lastReset
  };
};

// Получение доступных заданий
const getAvailableTasks = (userId) => {
  const userTaskData = getUserTasks(userId);
  const availableTasks = [];
  
  Object.values(TASK_TYPES).forEach(task => {
    const check = canCompleteTask(userId, task.id);
    const taskData = userTaskData[task.id];
    
    availableTasks.push({
      ...task,
      canComplete: check.canComplete,
      reason: check.reason,
      progress: {
        completed: taskData.completed,
        maxCompletions: task.maxCompletions,
        lastCompleted: taskData.lastCompleted
      }
    });
  });
  
  return availableTasks;
};

// Получение статистики заданий
const getTaskStats = (userId) => {
  const userTaskData = getUserTasks(userId);
  const availableTasks = getAvailableTasks(userId);
  
  const stats = {
    totalTasks: Object.keys(TASK_TYPES).length,
    completedTasks: Object.values(userTaskData).filter(t => t.completed > 0).length,
    availableTasks: availableTasks.filter(t => t.canComplete).length,
    totalCompletions: Object.values(userTaskData).reduce((sum, t) => sum + t.completed, 0),
    tasks: availableTasks
  };
  
  return stats;
};

// Сброс заданий по расписанию
const resetTasks = (userId) => {
  const userTaskData = getUserTasks(userId);
  const now = new Date();
  let resetCount = 0;
  
  Object.values(TASK_TYPES).forEach(task => {
    const taskData = userTaskData[task.id];
    
    if (task.resetPeriod === 'daily') {
      const daysDiff = Math.floor((now - taskData.lastReset) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 1) {
        taskData.completed = 0;
        taskData.lastReset = now;
        resetCount++;
      }
    } else if (task.resetPeriod === 'weekly') {
      const weeksDiff = Math.floor((now - taskData.lastReset) / (1000 * 60 * 60 * 24 * 7));
      if (weeksDiff >= 1) {
        taskData.completed = 0;
        taskData.lastReset = now;
        resetCount++;
      }
    }
  });
  
  return resetCount;
};

module.exports = {
  // Основные функции
  getUserTasks,
  getAvailableTasks,
  completeTask,
  canCompleteTask,
  
  // Статистика
  getTaskStats,
  
  // Утилиты
  resetTasks,
  
  // Константы
  TASK_TYPES
};
