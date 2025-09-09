const express = require('express');
const { getTransactionHistory } = require('./shared/balanceStore');

const router = express.Router();

// GET /api/recent-wins
router.get('/', async (req, res) => {
  try {
    console.log(`🏆 GET /api/recent-wins - запрос получен:`, { 
      timestamp: new Date().toISOString() 
    });

    // Получаем последние выигрыши из транзакций
    const recentWins = await getTransactionHistory(10); // Последние 10 выигрышей
    
    console.log(`📊 Получено ${recentWins.length} последних выигрышей`);
    
    res.json({ 
      success: true, 
      wins: recentWins 
    });
  } catch (error) {
    console.error('❌ Ошибка получения последних выигрышей:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

module.exports = router;
