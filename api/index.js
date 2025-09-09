const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Импортируем API routes
const balanceRoutes = require('./balance');
const clickRoutes = require('./click');
const rewardRoutes = require('./reward');
const recentWinsRoutes = require('./recent-wins');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/balance', balanceRoutes);
app.use('/api/click', clickRoutes);
app.use('/api/reward', rewardRoutes);
app.use('/api/recent-wins', recentWinsRoutes);

// Serve static files from webapp/dist
app.use(express.static(path.join(__dirname, '../webapp/dist')));

// Catch all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../webapp/dist/index.html'));
});

module.exports = app;
