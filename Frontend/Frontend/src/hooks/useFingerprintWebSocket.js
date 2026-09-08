// client/src/hooks/useFingerprintWebSocket.js

import { useState, useEffect, useCallback } from 'react';

// ✅ Smart WebSocket URL detection
const getWebSocketUrl = () => {
  // 1. Check environment variable first
  const envUrl = import.meta.env.VITE_WS_URL;
  
  // 2. Check if we're in production (HTTPS)
  const isProduction = window.location.protocol === 'https:';
  
  console.log('🔍 Environment:', {
    isProduction,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    envUrl: envUrl
  });
  
  // 3. If env var is set, clean it up
  if (envUrl) {
    // Remove any http:// or https:// prefix (keep only domain/path)
    let cleanUrl = envUrl.replace(/^https?:\/\//, '');
    
    // If it already has ws:// or wss://, use as-is
    if (envUrl.startsWith('ws://') || envUrl.startsWith('wss://')) {
      console.log('✅ Using WebSocket URL from env:', envUrl);
      return envUrl;
    }
    
    // Otherwise, add the correct protocol
    const protocol = isProduction ? 'wss://' : 'ws://';
    const finalUrl = `${protocol}${cleanUrl}`;
    console.log('✅ Constructed WebSocket URL:', finalUrl);
    return finalUrl;
  }
  
  // 4. No env var - use fallback
  const protocol = isProduction ? 'wss://' : 'ws://';
  const fallbackUrl = `${protocol}${window.location.hostname}/ws/fingerprint`;
  console.log('⚠️ Using fallback WebSocket URL:', fallbackUrl);
  return fallbackUrl;
};

// ✅ Singleton WebSocket Manager
class WebSocketManager {
  constructor() {
    if (WebSocketManager.instance) {
      return WebSocketManager.instance;
    }
    
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.subscribers = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.scannerStatus = {
      status: 'offline',
      isReady: false,
      isSimulated: true,
      deviceConnected: false,
      scannerType: 'unknown',
      deviceInfo: null,
      lastUpdated: null,
    };
    this._shouldStayConnected = true;
    this._wsUrl = getWebSocketUrl();
    
    console.log('🔗 WebSocket Manager initialized with URL:', this._wsUrl);
    
    WebSocketManager.instance = this;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    });
  }

  connect() {
    if (this.isConnecting || this.isConnected) {
      console.log('⚠️ WebSocket already connecting or connected');
      return;
    }

    this.isConnecting = true;
    const wsUrl = this._wsUrl;
    console.log('🔗 Connecting WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        const token = localStorage.getItem('accessToken');
        if (token && this.ws?.readyState === WebSocket.OPEN) {
          this.sendMessage({
            type: 'authenticate',
            payload: { token }
          });
        }
        
        this.notify({
          type: 'connected',
          payload: { 
            status: 'connected',
            timestamp: Date.now(),
            scanner: this.scannerStatus
          }
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notify(data);
        } catch (error) {
          console.error('WebSocket parse error:', error);
        }
      };

      this.ws.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        this.isConnected = false;
        this.isConnecting = false;
        
        this.notify({
          type: 'disconnected',
          payload: { 
            code: event.code,
            reason: event.reason,
            timestamp: Date.now()
          }
        });

        if (this._shouldStayConnected && event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          
          setTimeout(() => {
            this.connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    this._shouldStayConnected = false;
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
      this.isConnected = false;
      this.isConnecting = false;
      console.log('🔌 WebSocket manually disconnected');
    }
  }

  keepAlive() {
    this._shouldStayConnected = true;
    if (!this.isConnected && !this.isConnecting) {
      this.connect();
    }
  }

  sendMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('⚠️ Cannot send message - WebSocket not open');
    return false;
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      scannerStatus: this.scannerStatus,
    };
  }
}

// ✅ Singleton instance
const wsManager = new WebSocketManager();

// ✅ React Hook
export const useFingerprintWebSocket = () => {
  const [isConnected, setIsConnected] = useState(wsManager.isConnected);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [fingerprintData, setFingerprintData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [scannerStatus, setScannerStatus] = useState(wsManager.scannerStatus);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    wsManager.keepAlive();
  }, []);

  useEffect(() => {
    console.log(`📡 Subscribing to WebSocket`);

    const handleMessage = (data) => {
      console.log('📨 WebSocket message received:', data.type);
      
      switch (data.type) {
        case 'connected':
          setIsConnected(true);
          setError(null);
          if (data.payload?.scanner) {
            setScannerStatus(data.payload.scanner);
            wsManager.scannerStatus = data.payload.scanner;
          }
          break;
          
        case 'disconnected':
          setIsConnected(false);
          break;
          
        case 'authenticated':
          setIsAuthenticated(data.payload?.status === 'success');
          if (data.payload?.status !== 'success') {
            setError(data.payload?.error || 'Authentication failed');
          }
          break;
          
        case 'capture_started':
          setIsCapturing(true);
          setCaptureProgress(0);
          setError(null);
          break;
          
        case 'capture_progress':
          setCaptureProgress(data.payload?.progress || 0);
          setLiveData(data.payload);
          break;
          
        case 'capture_complete':
          setIsCapturing(false);
          setCaptureProgress(100);
          setFingerprintData(data.payload);
          break;
          
        case 'capture_error':
          setIsCapturing(false);
          setError(data.payload?.error || 'Capture failed');
          break;
          
        case 'capture_stopped':
          setIsCapturing(false);
          break;
          
        case 'error':
          setError(data.payload?.error || 'An error occurred');
          break;
          
        default:
          break;
      }
    };

    const unsubscribe = wsManager.subscribe(handleMessage);

    return () => {
      console.log('🔌 Unsubscribing from WebSocket');
      unsubscribe();
    };
  }, [token]);

  const startCapture = useCallback((fingerType = 'right_thumb') => {
    if (!wsManager.isConnected) {
      setError('Scanner not connected');
      return;
    }
    wsManager.sendMessage({
      type: 'start_capture',
      payload: { fingerType, timeout: 30000 }
    });
  }, []);

  const stopCapture = useCallback(() => {
    wsManager.sendMessage({ type: 'stop_capture' });
  }, []);

  const resetFingerprintData = useCallback(() => {
    setFingerprintData(null);
    setLiveData(null);
    setCaptureProgress(0);
    setIsCapturing(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const connect = useCallback(() => {
    wsManager.keepAlive();
  }, []);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
  }, []);

  const isScannerReady = useCallback(() => {
    return wsManager.isConnected && (scannerStatus.isReady || scannerStatus.isSimulated);
  }, [scannerStatus]);

  return {
    isConnected,
    isAuthenticated,
    error,
    scannerStatus,
    isScannerReady,
    isCapturing,
    captureProgress,
    fingerprintData,
    liveData,
    startCapture,
    stopCapture,
    resetFingerprintData,
    clearError,
    connect,
    disconnect,
  };
};

export default useFingerprintWebSocket;