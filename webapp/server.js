const express = require('express');
const path = require('path');
const apiRoutes = require('./api');
const app = express();
const PORT = process.env.PORT || 10000;

// Проверяем, что API роуты загружены
console.log('🔍 API роуты загружены:', typeof apiRoutes);
console.log('🔍 API роуты:', apiRoutes);

// Проверяем структуру API роутов
if (apiRoutes && typeof apiRoutes === 'function') {
    console.log('✅ API роуты загружены корректно');
} else {
    console.error('❌ Ошибка загрузки API роутов:', apiRoutes);
}

// Middleware для парсинга JSON
app.use(express.json());

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Тестовый endpoint для проверки
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Тестовый endpoint работает!',
        timestamp: new Date().toISOString(),
        apiRoutes: typeof apiRoutes,
        apiRoutesLoaded: !!apiRoutes
    });
});

// Тестовый endpoint для проверки API
app.get('/api-test', (req, res) => {
    res.json({
        success: true,
        message: 'API тестовый endpoint работает!',
        timestamp: new Date().toISOString(),
        apiRoutes: typeof apiRoutes,
        apiRoutesLoaded: !!apiRoutes,
        availableEndpoints: [
            '/api/health',
            '/api/user/balance/:userId',
            '/api/user/click/:userId',
            '/api/user/stats/:userId',
            '/api/user/info/:userId'
        ]
    });
});

// API роуты (должны быть ПЕРЕД статическими файлами)
app.use('/api', apiRoutes);

// Раздаем статические файлы из корневой папки (только для не-API запросов)
app.use(express.static(__dirname, {
    index: false // Отключаем автоматический index.html
}));

// Все остальные маршруты ведут на index.html (должен быть последним)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка ошибок сервера (должен быть ПЕРЕД app.listen)
app.use((err, req, res, next) => {
    console.error('❌ Ошибка сервера:', err);
    res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Magnum Stars WebApp запущен на порту ${PORT}`);
    console.log(`🌐 WebApp доступен по адресу: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
    console.log(`🔌 API доступен по адресу: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/api`);
    console.log(`📁 Статические файлы из: ${__dirname}`);
    console.log(`🔧 Режим: ${process.env.NODE_ENV || 'development'}`);
});
