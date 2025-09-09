const express = require('express');
const { getUserBalance, updateUserBalance } = require('./shared/balanceStore');

const router = express.Router();

// GET /api/balance/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const numericUserId = parseInt(userId);
    
    console.log(`🔍 GET /api/balance/:userId - запрос получен:`, { 
      userId: userId, 
      timestamp: new Date().toISOString() 
    });

    if (isNaN(numericUserId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный ID пользователя' 
      });
    }

    const balance = await getUserBalance(numericUserId);
    
    if (balance) {
      console.log(`📊 Получен баланс для пользователя ${userId}:`, balance);
      res.json({ 
        success: true, 
        ...balance 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Пользователь не найден' 
      });
    }
  } catch (error) {
    console.error('❌ Ошибка получения баланса:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

// POST /api/balance/:userId
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, amount, reason } = req.body;
    const numericUserId = parseInt(userId);
    
    console.log(`🔍 POST /api/balance/:userId - запрос получен:`, { 
      userId: userId, 
      body: { type, amount, reason },
      timestamp: new Date().toISOString() 
    });

    if (isNaN(numericUserId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный ID пользователя' 
      });
    }

    if (!type || amount === undefined || !reason) {
      return res.status(400).json({ 
        success: false, 
        error: 'Недостаточно параметров' 
      });
    }

    console.log(`💰 Обновляем баланс для пользователя ${userId}:`, { type, amount, reason });
    
    const updatedBalance = await updateUserBalance(numericUserId, type, amount, reason);
    
    if (updatedBalance) {
      console.log(`✅ Баланс обновлен для пользователя ${userId}:`, updatedBalance);
      res.json({ 
        success: true, 
        ...updatedBalance 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка обновления баланса' 
      });
    }
  } catch (error) {
    console.error('❌ Ошибка обновления баланса:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Внутренняя ошибка сервера' 
    });
  }
});

module.exports = router;
