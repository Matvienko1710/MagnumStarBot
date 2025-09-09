// Тестовый скрипт для проверки API баланса
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testBalanceAPI() {
    const baseUrl = 'http://localhost:3000';
    const testUserId = 123456;
    
    console.log('🧪 Тестируем API баланса...');
    
    try {
        // Тест 1: Получение баланса
        console.log('\n1️⃣ Получаем баланс пользователя...');
        const getResponse = await fetch(`${baseUrl}/api/balance/${testUserId}`);
        const getData = await getResponse.json();
        console.log('✅ Получение баланса:', getData);
        
        // Тест 2: Попытка списания средств (должна сработать)
        console.log('\n2️⃣ Пытаемся списать 50 монет...');
        const deductResponse = await fetch(`${baseUrl}/api/balance/${testUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'coins',
                amount: -50,
                reason: 'test_deduction'
            })
        });
        const deductData = await deductResponse.json();
        console.log('✅ Списание 50 монет:', deductData);
        
        // Тест 3: Попытка списать больше, чем есть (должна вернуть ошибку)
        console.log('\n3️⃣ Пытаемся списать 10000 монет (больше чем есть)...');
        const overDeductResponse = await fetch(`${baseUrl}/api/balance/${testUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'coins',
                amount: -10000,
                reason: 'test_over_deduction'
            })
        });
        const overDeductData = await overDeductResponse.json();
        console.log('✅ Попытка списать 10000 монет:', overDeductData);
        
        // Тест 4: Финальный баланс
        console.log('\n4️⃣ Финальный баланс...');
        const finalResponse = await fetch(`${baseUrl}/api/balance/${testUserId}`);
        const finalData = await finalResponse.json();
        console.log('✅ Финальный баланс:', finalData);
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
    }
}

// Запускаем тест через 3 секунды (даем время серверу запуститься)
setTimeout(testBalanceAPI, 3000);
