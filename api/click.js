const express = require('express');
const { updateUserBalance } = require('./shared/balanceStore');

const router = express.Router();

// POST /api/click/:userId
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const numericUserId = parseInt(userId);
    
    console.log(`🖱️ POST /api/click/:userId - запрос получен:`, { 
      userId: userId, 
      timestamp: new Date().toISOString() 
    });

    if (isNaN(numericUserId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный ID пользователя' 
      });
    }

    // Награда за клик
    const reward = 1; // 1 монета за клик
    
    console.log(`💰 Выдаем награду за клик пользователю ${userId}:`, { reward });
    
    const updatedBalance = await updateUserBalance(numericUserId, 'coins', reward, 'click_reward');
    
    if (updatedBalance) {
      console.log(`✅ Награда за клик выдана пользователю ${userId}:`, updatedBalance);
      res.json({ 
        success: true, 
        reward: reward,
        ...updatedBalance 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка выдачи награды' 
      });
    }
  } catch (error) {
    console.error('❌ Ошибка выдачи награды за клик:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Внутренняя ошибка сервера' 
    });
  }
});

module.exports = router;
