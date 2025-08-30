const { MongoClient } = require('mongodb');

// Ваш MongoDB URI
const uri = "mongodb+srv://magnumstar:Indesi474848@cluster0.flbhe9f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
    console.log('🧪 Тестирование подключения к MongoDB Atlas...');
    console.log('📊 URI:', uri.substring(0, 30) + '...');
    
    const client = new MongoClient(uri, {
        serverApi: {
            version: '1',
            strict: true,
            deprecationErrors: true,
        },
        retryWrites: true,
        w: 'majority',
        maxPoolSize: 5,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
    });

    try {
        console.log('🔧 Подключение...');
        await client.connect();
        
        console.log('✅ Подключение успешно!');
        
        // Тестируем ping
        const result = await client.db('admin').command({ ping: 1 });
        console.log('✅ Ping успешен:', result);
        
        // Получаем список баз данных
        const databases = await client.db().admin().listDatabases();
        console.log('📊 Доступные базы данных:', databases.databases.map(db => db.name));
        
        // Тестируем создание коллекции
        const testCollection = client.db('magnumstar').collection('test');
        await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
        console.log('✅ Тестовая запись создана');
        
        // Удаляем тестовую запись
        await testCollection.deleteOne({ test: 'connection' });
        console.log('✅ Тестовая запись удалена');
        
        console.log('🎉 Все тесты прошли успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка подключения:', error.message);
        console.error('🔍 Детали ошибки:', {
            code: error.code,
            name: error.name,
            stack: error.stack?.split('\n')[0]
        });
    } finally {
        await client.close();
        console.log('🔒 Соединение закрыто');
    }
}

// Запускаем тест
testConnection().catch(console.error);
