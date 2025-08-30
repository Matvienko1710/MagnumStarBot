const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Раздаем статические файлы из корневой папки
app.use(express.static(__dirname));

// Все маршруты ведут на index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`WebApp сервер запущен на порту ${PORT}`);
    console.log(`Откройте http://localhost:${PORT} в браузере`);
});
