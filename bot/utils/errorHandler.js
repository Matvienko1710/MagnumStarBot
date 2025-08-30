// Централизованная обработка ошибок для утилит

// Функция для безопасного выполнения операций с валютой
const safeCurrencyOperation = (operation, userId, amount = 0) => {
  try {
    return operation();
  } catch (error) {
    console.error(`[Currency Error] User ${userId}, Amount: ${amount}, Error:`, error.message);
    throw new Error(`Ошибка операции с валютой: ${error.message}`);
  }
};

// Функция для безопасного выполнения операций с ключами
const safeKeyOperation = (operation, userId, key = '') => {
  try {
    return operation();
  } catch (error) {
    console.error(`[Key Error] User ${userId}, Key: ${key}, Error:`, error.message);
    throw new Error(`Ошибка операции с ключом: ${error.message}`);
  }
};

// Функция для безопасного выполнения операций с майнерами
const safeMinerOperation = (operation, userId, minerType = '') => {
  try {
    return operation();
  } catch (error) {
    console.error(`[Miner Error] User ${userId}, Miner: ${minerType}, Error:`, error.message);
    throw new Error(`Ошибка операции с майнером: ${error.message}`);
  }
};

// Функция для безопасного выполнения операций с титулами
const safeTitleOperation = (operation, userId, titleId = '') => {
  try {
    return operation();
  } catch (error) {
    console.error(`[Title Error] User ${userId}, Title: ${titleId}, Error:`, error.message);
    throw new Error(`Ошибка операции с титулом: ${error.message}`);
  }
};

// Функция для безопасного выполнения операций с рефералами
const safeReferralOperation = (operation, userId, referralCode = '') => {
  try {
    return operation();
  } catch (error) {
    console.error(`[Referral Error] User ${userId}, Code: ${referralCode}, Error:`, error.message);
    throw new Error(`Ошибка реферальной операции: ${error.message}`);
  }
};

// Функция для валидации входных данных
const validateInput = (data, type) => {
  const validators = {
    userId: (id) => {
      if (!id || typeof id !== 'number' || id <= 0) {
        throw new Error('Некорректный ID пользователя');
      }
    },
    amount: (amount) => {
      if (!amount || typeof amount !== 'number' || amount < 0) {
        throw new Error('Некорректная сумма');
      }
    },
    key: (key) => {
      if (!key || typeof key !== 'string' || key.length !== 12) {
        throw new Error('Некорректный формат ключа');
      }
    },
    referralCode: (code) => {
      if (!code || typeof code !== 'string' || code.length < 3) {
        throw new Error('Некорректный реферальный код');
      }
    }
  };

  if (validators[type]) {
    validators[type](data);
  }
};

// Функция для восстановления состояния после ошибки
const recoverFromError = (userId, operation) => {
  try {
    console.log(`[Recovery] Attempting to recover user ${userId} from operation: ${operation}`);
    // Здесь можно добавить логику восстановления состояния
    // Например, очистка временных данных, сброс состояний и т.д.
  } catch (error) {
    console.error(`[Recovery Error] Failed to recover user ${userId}:`, error.message);
  }
};

module.exports = {
  safeCurrencyOperation,
  safeKeyOperation,
  safeMinerOperation,
  safeTitleOperation,
  safeReferralOperation,
  validateInput,
  recoverFromError
};
