// backend/config/websocket.js
const WebSocket = require('ws');
const EventEmitter = require('events');
const url = require('url');

class WebSocketManager extends EventEmitter {
  constructor(server) {
    super();
    
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/fingerprint',
      perMessageDeflate: false,
      maxPayload: 5 * 1024 * 1024, // 5MB
      clientTracking: true,
    });
    
    this.clients = new Map();
    this.init();
  }

  init() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const params = url.parse(req.url, true).query;
      
      // Store client info
      this.clients.set(clientId, {
        ws,
        id: clientId,
        userId: params.userId || null,
        isAuthenticated: !!params.token,
        lastActivity: Date.now(),
        currentCapture: null,
        fingerType: null,
        isCapturing: false,
      });

      console.log(`🟢 WebSocket client connected: ${clientId}`);
      
      // Send connection confirmation
      this.sendToClient(clientId, {
        type: 'connected',
        payload: {
          clientId,
          status: 'ready',
          timestamp: Date.now(),
          capabilities: ['capture', 'verify', 'live_preview']
        }
      });

      // Setup message handler
      ws.on('message', async (message) => {
        try {
          await this.handleMessage(clientId, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
          this.sendToClient(clientId, {
            type: 'error',
            payload: { error: error.message }
          });
        }
      });

      // Setup close handler
      ws.on('close', (code, reason) => {
        this.handleDisconnect(clientId);
      });

      // Setup error handler
      ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
        this.sendToClient(clientId, {
          type: 'error',
          payload: { error: 'WebSocket connection error' }
        });
      });

      // Setup ping/pong for keep-alive
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastActivity = Date.now();
        }
      });

      // Send ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, 30000);

      ws._pingInterval = pingInterval;
    });

    console.log('🔗 WebSocket server initialized on /ws/fingerprint');
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      throw new Error('Invalid JSON message');
    }

    const { type, payload = {} } = data;

    // ✅ Emit event for WebSocketService to handle
    this.emit('message', clientId, data);

    // Also handle basic messages here
    switch (type) {
      case 'authenticate':
        await this.handleAuthenticate(clientId, payload);
        break;
      case 'start_capture':
      case 'stop_capture':
      case 'start_verification':
      case 'stop_verification':
      case 'get_live_preview':
        // These are handled by WebSocketService via event
        break;
      default:
        // Don't throw for unknown - let service handle it
        console.log(`Unknown message type: ${type}`);
    }

    client.lastActivity = Date.now();
  }

  async handleAuthenticate(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { token, userId } = payload;
    
    try {
      // Import JWT service dynamically to avoid circular dependencies
      const JWTService = require('../services/jwtService');
      const decoded = JWTService.verifyToken(token);
      
      if (decoded.userId !== userId) {
        throw new Error('Token does not match user');
      }

      client.userId = userId;
      client.isAuthenticated = true;

      this.sendToClient(clientId, {
        type: 'authenticated',
        payload: {
          status: 'success',
          userId,
          timestamp: Date.now()
        }
      });

      console.log(`✅ Client ${clientId} authenticated as user ${userId}`);
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'authenticated',
        payload: {
          status: 'failed',
          error: error.message
        }
      });
    }
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      // Clean up intervals
      if (client.ws._pingInterval) {
        clearInterval(client.ws._pingInterval);
      }
      
      // Clean up capture state
      if (client.currentCapture) {
        client.currentCapture.isActive = false;
        client.currentCapture = null;
      }
    }
    
    this.clients.delete(clientId);
    console.log(`🔴 WebSocket client disconnected: ${clientId}`);
    
    // Emit disconnect event
    this.emit('disconnect', clientId);
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client && client.ws && client.ws.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        client.ws.send(message);
        return true;
      } catch (error) {
        console.error(`Failed to send to client ${clientId}:`, error);
        return false;
      }
    }
    return false;
  }

  broadcast(data, filter = null) {
    let sent = 0;
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        if (!filter || filter(clientId)) {
          try {
            client.ws.send(message);
            sent++;
          } catch (error) {
            console.error(`Failed to broadcast to ${clientId}:`, error);
          }
        }
      }
    }
    return sent;
  }

  getConnectedClients() {
    const clients = [];
    for (const [id, client] of this.clients) {
      clients.push({
        id,
        userId: client.userId,
        isAuthenticated: client.isAuthenticated,
        lastActivity: client.lastActivity,
        fingerType: client.fingerType,
        isCapturing: client.isCapturing,
        connectedAt: client.connectedAt || new Date()
      });
    }
    return clients;
  }

  getClient(clientId) {
    return this.clients.get(clientId) || null;
  }

  disconnectClient(clientId, code = 1000, reason = 'Server initiated disconnect') {
    const client = this.clients.get(clientId);
    if (client && client.ws) {
      client.ws.close(code, reason);
    }
  }
}

module.exports = WebSocketManager;