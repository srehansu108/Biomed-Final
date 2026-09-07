import { useState, useEffect, useRef, useCallback } from 'react';

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
    this._shouldStayConnected = true; // ✅ NEW: Keep connection alive
    
    WebSocketManager.instance = this;
  }

  // ✅ Subscribe to WebSocket events
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // ✅ Notify all subscribers
  notify(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    });
  }

  // ✅ Connect once
  connect() {
    if (this.isConnecting || this.isConnected) {
      console.log('⚠️ WebSocket already connecting or connected');
      return;
    }

    this.isConnecting = true;
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/fingerprint';
    console.log('🔗 Connecting WebSocket (singleton):', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected (singleton)');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // ✅ Send authentication if token exists
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

        // ✅ Auto-reconnect if we should stay connected
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
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
    }
  }

  // ✅ Disconnect only when explicitly called
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

  // ✅ Keep connection alive (call when app starts)
  keepAlive() {
    this._shouldStayConnected = true;
    if (!this.isConnected && !this.isConnecting) {
      this.connect();
    }
  }

  // ✅ Send message
  sendMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('⚠️ Cannot send message - WebSocket not open');
    return false;
  }

  // ✅ Get connection status
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

// ✅ React Hook using the singleton
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

  // ✅ Ensure WebSocket stays alive
  useEffect(() => {
    wsManager.keepAlive();
  }, []);

  // ✅ Subscribe to WebSocket messages
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

    // ✅ Subscribe to singleton manager
    const unsubscribe = wsManager.subscribe(handleMessage);

    // ✅ Cleanup: only unsubscribe, don't disconnect
    return () => {
      console.log('🔌 Unsubscribing from WebSocket');
      unsubscribe();
      // ✅ DO NOT disconnect the WebSocket here!
    };
  }, [token]);

  // ============================================
  // ✅ API Functions
  // ============================================
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