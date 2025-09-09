// API для получения последних выигрышей из кейсов

let recentWins = [
  // Начальные тестовые данные
  {
    id: 1,
    username: 'CryptoKing',
    item: 'ДЖЕКПОТ Звезд!',
    amount: 50,
    type: 'stars',
    timestamp: Date.now() - 60000,
    rarity: 'legendary'
  },
  {
    id: 2,
    username: 'StarHunter',
    item: '25 Звезд',
    amount: 25,
    type: 'stars',
    timestamp: Date.now() - 120000,
    rarity: 'epic'
  },
  {
    id: 3,
    username: 'CoinMaster',
    item: '1000 Монет',
    amount: 1000,
    type: 'coins',
    timestamp: Date.now() - 180000,
    rarity: 'epic'
  },
  {
    id: 4,
    username: 'LuckyPlayer',
    item: '500 Монет',
    amount: 500,
    type: 'coins',
    timestamp: Date.now() - 240000,
    rarity: 'rare'
  },
  {
    id: 5,
    username: 'GamerPro',
    item: '10 Звезд',
    amount: 10,
    type: 'stars',
    timestamp: Date.now() - 300000,
    rarity: 'rare'
  }
];

// Добавление нового выигрыша
export function addWin(username, item, amount, type, rarity = 'common') {
  const newWin = {
    id: Date.now(),
    username: username,
    item: item,
    amount: amount,
    type: type,
    timestamp: Date.now(),
    rarity: rarity
  };

  // Добавляем в начало массива
  recentWins = [newWin, ...recentWins.slice(0, 19)]; // Храним только последние 20

  console.log(`🎰 Новый выигрыш: ${username} выиграл ${amount} ${type === 'stars' ? 'звезд' : 'монет'}`);
  
  return newWin;
}

// API endpoint
export default function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Возвращаем последние выигрыши
    res.status(200).json({
      success: true,
      wins: recentWins.slice(0, 10), // Возвращаем последние 10
      timestamp: Date.now()
    });
  } 
  else if (req.method === 'POST') {
    // Добавляем новый выигрыш (для интеграции с ботом)
    try {
      const { username, item, amount, type, rarity } = req.body;
      
      if (!username || !item || !amount || !type) {
        return res.status(400).json({
          success: false,
          error: 'Отсутствуют обязательные поля'
        });
      }

      const newWin = addWin(username, item, amount, type, rarity);
      
      res.status(200).json({
        success: true,
        win: newWin,
        message: 'Выигрыш добавлен'
      });
    } catch (error) {
      console.error('Ошибка добавления выигрыша:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
      });
    }
  } 
  else {
    res.status(405).json({
      success: false,
      error: 'Метод не поддерживается'
    });
  }
}

// Функция для использования в боте
export { addWin };
