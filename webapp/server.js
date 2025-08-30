const express = require('express');
const path = require('path');
const apiRoutes = require('./api');
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware для парсинга JSON
app.use(express.json());

// API роуты
app.use('/api', apiRoutes);

// Раздаем статические файлы из корневой папки
app.use(express.static(__dirname));

// Все остальные маршруты ведут на index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Magnum Stars WebApp запущен на порту ${PORT}`);
    console.log(`🌐 WebApp доступен по адресу: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
    console.log(`🔌 API доступен по адресу: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/api`);
});
