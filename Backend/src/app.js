// src/app.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Connect to Database with proper handling
let dbConnected = false;

connectDB()
  .then(() => {
    dbConnected = true;
    console.log('✅ Database connection established successfully');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    dbConnected = false;
  });

// ✅ Health check with DB status
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    dbConnected,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    dbConnected,
    timestamp: new Date().toISOString()
  });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fingerprintRoutes = require('./routes/fingerprintRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/fingerprints', fingerprintRoutes);

// ✅ WebSocket route info
app.get('/ws/info', (req, res) => {
  res.json({
    websocket: {
      url: `ws://localhost:${process.env.PORT || 8000}/ws/fingerprint`,
      path: '/ws/fingerprint',
      status: 'active',
      version: '1.0.0'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = app;