const WebSocketManager = require('../config/websocket');
const BiometricService = require('./biometricService');
const Fingerprint = require('../models/Fingerprint');
const User = require('../models/User');

class WebSocketService {
  constructor() {
    this.manager = null;
    this.initialized = false;
  }

  initialize(server) {
    if (this.initialized) return;
    
    this.manager = new WebSocketManager(server);
    this.initialized = true;
    console.log('✅ WebSocket service initialized');
  }

  getManager() {
    return this.manager;
  }

  async handleCapture(clientId, fingerType, onProgress) {
    try {
      const result = await BiometricService.captureFingerprint(
        fingerType,
        onProgress
      );
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  async handleVerification(clientId, userId, fingerType, onProgress) {
    try {
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Find fingerprint
      const fingerprint = await Fingerprint.findOne({
        userId: user._id,
        fingerType,
        isActive: true
      });

      if (!fingerprint) {
        throw new Error(`No fingerprint found for ${fingerType}`);
      }

      // Capture fingerprint with progress
      const captureResult = await BiometricService.captureFingerprint(
        fingerType,
        onProgress
      );

      if (!captureResult.success) {
        throw new Error(captureResult.error);
      }

      // Verify captured fingerprint against stored
      const verification = await BiometricService.verifyFingerprint(
        captureResult.template,
        fingerprint,
        user._id.toString()
      );

      // Update fingerprint verification count
      await fingerprint.incrementVerification(
        verification.isMatch ? 'success' : 'failure',
        verification.matchScore
      );

      return {
        verified: verification.isMatch,
        matchScore: verification.matchScore,
        capturedQuality: captureResult.quality,
        storedQuality: fingerprint.qualityScore
      };
    } catch (error) {
      throw error;
    }
  }

  broadcastToUser(userId, data) {
    if (!this.manager) return 0;
    
    return this.manager.broadcast(data, (clientId) => {
      const client = this.manager.clients.get(clientId);
      return client && client.userId === userId;
    });
  }

  async getConnectedUsers() {
    if (!this.manager) return [];
    
    const clients = this.manager.getConnectedClients();
    const users = [];
    
    for (const client of clients) {
      if (client.userId) {
        users.push({
          userId: client.userId,
          clientId: client.id,
          lastActivity: client.lastActivity,
          isCapturing: client.isCapturing
        });
      }
    }
    
    return users;
  }

  disconnectAll() {
    if (!this.manager) return;
    
    for (const [clientId, client] of this.manager.clients) {
      if (client.ws) {
        client.ws.close();
      }
    }
    
    this.manager.clients.clear();
  }
}

module.exports = new WebSocketService();