// server.js
const app = require('./src/app');
const http = require('http');
const WebSocketManager = require('./src/config/websocket');
require('dotenv').config();

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

// ✅ Initialize WebSocket server
let wsManager = null;

// ✅ Only start the server if this file is run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    
    // ✅ Initialize WebSocket after server is listening
    wsManager = new WebSocketManager(server);
    console.log(`🔗 WebSocket: ws://localhost:${PORT}/ws/fingerprint`);
    console.log(`\n✅ Server is ready!\n`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  // Close WebSocket connections
  if (wsManager) {
    wsManager.wss.close(() => {
      server.close(() => process.exit(0));
    });
  } else {
    server.close(() => process.exit(0));
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (wsManager) {
    wsManager.wss.close(() => {
      server.close(() => process.exit(0));
    });
  } else {
    server.close(() => process.exit(0));
  }
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

module.exports = { server, wsManager };