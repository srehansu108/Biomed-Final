const WebSocket = require('ws');
const url = require('url');
const BiometricService = require('../services/biometricService');

class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/fingerprint',
      perMessageDeflate: false,
      maxPayload: 5 * 1024 * 1024, // 5MB
    });
    
    this.clients = new Map();
    this.init();
  }

  init() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const params = url.parse(req.url, true).query;
      
      this.clients.set(clientId, {
        ws,
        userId: params.userId || null,
        isAuthenticated: !!params.token,
        lastActivity: Date.now(),
        currentCapture: null,
        fingerType: null,
      });

      console.log(`🟢 WebSocket client connected: ${clientId}`);
      
      // Send connection confirmation
      this.sendToClient(clientId, {
        type: 'connected',
        payload: {
          clientId,
          status: 'ready',
          timestamp: Date.now(),
          capabilities: ['capture', 'verify', 'live_preview'],
          serverTime: new Date().toISOString(),
          scanner: BiometricService.getScannerStatus()
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
      ws.on('close', () => {
        this.handleDisconnect(clientId);
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
    if (!client) return;

    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      throw new Error('Invalid JSON message');
    }

    const { type, payload = {} } = data;

    switch (type) {
      case 'authenticate':
        await this.handleAuthenticate(clientId, payload);
        break;
      case 'start_capture':
        await this.handleStartCapture(clientId, payload);
        break;
      case 'stop_capture':
        await this.handleStopCapture(clientId);
        break;
      case 'start_verification':
        await this.handleStartVerification(clientId, payload);
        break;
      case 'stop_verification':
        await this.handleStopVerification(clientId);
        break;
      case 'get_live_preview':
        await this.handleLivePreview(clientId);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    client.lastActivity = Date.now();
  }

  async handleAuthenticate(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { token, userId } = payload;
    
    try {
      // Verify token
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

  async handleStartCapture(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.isAuthenticated) {
      throw new Error('Unauthenticated client');
    }

    const { fingerType = 'right_thumb', timeout = 30000 } = payload;
    const BiometricService = require('../services/biometricService');

    // Check if already capturing
    if (client.currentCapture) {
      throw new Error('Already capturing fingerprint');
    }

    // Notify capture started
    this.sendToClient(clientId, {
      type: 'capture_started',
      payload: { fingerType, timestamp: Date.now() }
    });

    client.currentCapture = {
      fingerType,
      startTime: Date.now(),
      timeout,
      progress: 0,
      isActive: true,
    };
    client.fingerType = fingerType;

    try {
      // Capture with progress callback
      const result = await BiometricService.captureFingerprint(
        fingerType,
        (progressData) => {
          // Update progress
          if (client.currentCapture) {
            client.currentCapture.progress = progressData.progress || 0;
          }

          // Send progress update
          this.sendToClient(clientId, {
            type: 'capture_progress',
            payload: {
              ...progressData,
              fingerType,
              timestamp: Date.now(),
              clientId
            }
          });
        },
        timeout
      );

      // Check if capture was stopped
      if (!client.currentCapture || !client.currentCapture.isActive) {
        this.sendToClient(clientId, {
          type: 'capture_stopped',
          payload: { fingerType, timestamp: Date.now() }
        });
        return;
      }

      // Capture complete
      client.currentCapture.isActive = false;

      this.sendToClient(clientId, {
        type: 'capture_complete',
        payload: {
          ...result,
          fingerType,
          timestamp: Date.now(),
          clientId
        }
      });

      // Clear capture state after completion
      setTimeout(() => {
        if (client.currentCapture) {
          client.currentCapture = null;
          client.fingerType = null;
        }
      }, 1000);

    } catch (error) {
      client.currentCapture = null;
      client.fingerType = null;

      this.sendToClient(clientId, {
        type: 'capture_error',
        payload: {
          fingerType,
          error: error.message,
          timestamp: Date.now()
        }
      });
    }
  }

  async handleStopCapture(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (client.currentCapture) {
      client.currentCapture.isActive = false;
      client.currentCapture = null;
      client.fingerType = null;

      this.sendToClient(clientId, {
        type: 'capture_stopped',
        payload: { timestamp: Date.now() }
      });
    }
  }

  async handleStartVerification(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.isAuthenticated) {
      throw new Error('Unauthenticated client');
    }

    const { userId, fingerType = 'right_thumb', timeout = 30000 } = payload;
    const BiometricService = require('../services/biometricService');

    this.sendToClient(clientId, {
      type: 'verification_started',
      payload: { userId, fingerType, timestamp: Date.now() }
    });

    try {
      const result = await BiometricService.verifyFingerprintWithWebSocket(
        userId,
        fingerType,
        (progressData) => {
          this.sendToClient(clientId, {
            type: 'verification_progress',
            payload: {
              ...progressData,
              userId,
              fingerType,
              timestamp: Date.now()
            }
          });
        },
        timeout
      );

      this.sendToClient(clientId, {
        type: 'verification_complete',
        payload: {
          ...result,
          userId,
          fingerType,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      this.sendToClient(clientId, {
        type: 'verification_error',
        payload: {
          userId,
          fingerType,
          error: error.message,
          timestamp: Date.now()
        }
      });
    }
  }

  async handleStopVerification(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.sendToClient(clientId, {
      type: 'verification_stopped',
      payload: { timestamp: Date.now() }
    });
  }

  async handleLivePreview(clientId) {
    const client = this.clients.get(clientId);
    if (!client || !client.isAuthenticated) {
      throw new Error('Unauthenticated client');
    }

    const BiometricService = require('../services/biometricService');

    this.sendToClient(clientId, {
      type: 'live_preview_started',
      payload: { timestamp: Date.now() }
    });

    // Stream live preview
    let streaming = true;
    let frameCount = 0;

    const streamInterval = setInterval(async () => {
      if (!streaming || !this.clients.has(clientId)) {
        clearInterval(streamInterval);
        return;
      }

      try {
        const frame = await BiometricService.getLivePreview();
        frameCount++;

        this.sendToClient(clientId, {
          type: 'live_preview_frame',
          payload: {
            frameId: frameCount,
            imageData: frame.imageData,
            width: frame.width || 400,
            height: frame.height || 400,
            timestamp: Date.now()
          }
        });

      } catch (error) {
        console.error('Live preview error:', error);
        clearInterval(streamInterval);
        this.sendToClient(clientId, {
          type: 'live_preview_error',
          payload: {
            error: error.message,
            timestamp: Date.now()
          }
        });
      }
    }, 33); // ~30fps

    // Store interval for cleanup
    client._livePreviewInterval = streamInterval;

    // Stop after 30 seconds
    setTimeout(() => {
      streaming = false;
      clearInterval(streamInterval);
      this.sendToClient(clientId, {
        type: 'live_preview_stopped',
        payload: { 
          frames: frameCount,
          duration: 30,
          timestamp: Date.now() 
        }
      });
    }, 30000);
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      // Clean up intervals
      if (client._pingInterval) {
        clearInterval(client._pingInterval);
      }
      if (client._livePreviewInterval) {
        clearInterval(client._livePreviewInterval);
      }
      
      // Clean up capture state
      if (client.currentCapture) {
        client.currentCapture.isActive = false;
        client.currentCapture = null;
      }
    }
    
    this.clients.delete(clientId);
    console.log(`🔴 WebSocket client disconnected: ${clientId}`);
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client && client.ws && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(data));
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
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Find client by ws reference
        let foundClient = null;
        for (const [id, client] of this.clients) {
          if (client.ws === ws) {
            foundClient = id;
            break;
          }
        }
        
        if (!filter || filter(foundClient)) {
          try {
            ws.send(JSON.stringify(data));
            sent++;
          } catch (error) {
            // Skip failed sends
          }
        }
      }
    });
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
        isCapturing: !!client.currentCapture
      });
    }
    return clients;
  }
}

module.exports = WebSocketManager;