// Тестовый скрипт для проверки API баланса на Render
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRenderAPI() {
    // Замените на ваш URL Render приложения
    const baseUrl = 'https://magnum-star-bot.onrender.com'; // Замените на ваш URL
    const testUserId = 123456;
    
    console.log('🌐 Тестируем API баланса на Render...');
    console.log(`📍 URL: ${baseUrl}`);
    
    try {
        // Тест 1: Health check
        console.log('\n1️⃣ Проверяем health check...');
        const healthResponse = await fetch(`${baseUrl}/api/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        
        // Тест 2: Получение баланса
        console.log('\n2️⃣ Получаем баланс пользователя...');
        const getResponse = await fetch(`${baseUrl}/api/balance/${testUserId}`);
        const getData = await getResponse.json();
        console.log('✅ Получение баланса:', getData);
        
        // Тест 3: Попытка списания средств (должна сработать)
        console.log('\n3️⃣ Пытаемся списать 50 монет...');
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
        
        // Тест 4: Попытка списать больше, чем есть (должна вернуть ошибку)
        console.log('\n4️⃣ Пытаемся списать 10000 монет (больше чем есть)...');
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
        
        // Тест 5: Финальный баланс
        console.log('\n5️⃣ Финальный баланс...');
        const finalResponse = await fetch(`${baseUrl}/api/balance/${testUserId}`);
        const finalData = await finalResponse.json();
        console.log('✅ Финальный баланс:', finalData);
        
        console.log('\n🎉 Все тесты завершены!');
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Запускаем тест
testRenderAPI();
