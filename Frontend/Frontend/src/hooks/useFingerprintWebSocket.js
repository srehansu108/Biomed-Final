// client/src/hooks/useFingerprintWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const useFingerprintWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [fingerprintData, setFingerprintData] = useState(null);
  const [liveData, setLiveData] = useState(null);

  const [scannerStatus, setScannerStatus] = useState({
    status: 'offline',
    isReady: false,
    isSimulated: true,
    deviceConnected: false,
    scannerType: 'unknown',
    deviceInfo: null,
    lastUpdated: null,
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const isMounted = useRef(true);
  const isConnecting = useRef(false);
  const token = localStorage.getItem('token');

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN || 
            wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(1000, 'Cleanup');
        }
      } catch (e) {}
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsAuthenticated(false);
    setIsCapturing(false);
    isConnecting.current = false;
  }, []);

  // ============================================
  // WebSocket Message Handler
  // ============================================
  const handleWebSocketMessage = useCallback((data) => {
    console.log('📨 WebSocket Message:', data.type, data.payload);

    switch (data.type) {
      case 'connected': {
        console.log('✅ Scanner ready:', data.payload);
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        isConnecting.current = false;

        if (data.payload.scanner) {
          const scanner = data.payload.scanner;
          console.log('📟 Scanner status:', scanner);
          setScannerStatus({
            status: scanner.status || 'offline',
            isReady: scanner.isReady || false,
            isSimulated: scanner.isSimulated !== false,
            deviceConnected: scanner.status === 'online' || scanner.status === 'futronic',
            scannerType: scanner.scannerType || 'unknown',
            deviceInfo: scanner.deviceInfo || null,
            lastUpdated: new Date().toISOString(),
          });
        }
        break;
      }

      case 'authenticated': {
        if (data.payload.status === 'success') {
          setIsAuthenticated(true);
          console.log('✅ WebSocket authenticated');
        } else {
          setError(data.payload.error || 'Authentication failed');
        }
        break;
      }

      // ✅ Handle error messages
      case 'error': {
        console.error('❌ Server error:', data.payload);
        const errorMsg = data.payload.error || 'An error occurred';
        setError(errorMsg);
        setIsCapturing(false);
        if (errorMsg.includes('scanner') || errorMsg.includes('device')) {
          setScannerStatus(prev => ({
            ...prev,
            status: 'error',
            deviceConnected: false,
          }));
        }
        break;
      }

      case 'capture_started': {
        console.log('📸 Capture started');
        setIsCapturing(true);
        setCaptureProgress(0);
        setError(null);
        break;
      }

      case 'capture_progress': {
        setCaptureProgress(data.payload.progress);
        setLiveData(data.payload);
        if (data.payload.imageData) {
          setFingerprintData(data.payload);
        }
        break;
      }

      case 'capture_complete': {
        console.log('📸 Capture complete');
        setIsCapturing(false);
        setCaptureProgress(100);
        setFingerprintData(data.payload);
        setError(null);
        break;
      }

      case 'capture_error': {
        console.error('❌ Capture error:', data.payload);
        setIsCapturing(false);
        setError(data.payload.error || 'Capture failed');
        break;
      }

      case 'capture_stopped': {
        console.log('⏹️ Capture stopped');
        setIsCapturing(false);
        break;
      }

      default: {
        console.log('❓ Unknown message type:', data.type);
        break;
      }
    }
  }, []);

  // ============================================
  // Connect to WebSocket
  // ============================================
  const connect = useCallback(() => {
    if (isConnecting.current) {
      console.log('⚠️ Connection already in progress, skipping...');
      return;
    }
    cleanup();
    if (!isMounted.current) return;
    isConnecting.current = true;

    try {
      const wsUrl = 'ws://localhost:8000/ws/fingerprint';
      console.log('🔗 Connecting to WebSocket:', wsUrl);

      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.binaryType = 'arraybuffer';

      wsRef.current.onopen = () => {
        if (!isMounted.current) return;
        console.log('✅ WebSocket OPENED');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        isConnecting.current = false;

        if (token) {
          console.log('🔐 Sending authentication...');
          wsRef.current.send(
            JSON.stringify({
              type: 'authenticate',
              payload: { token },
            })
          );
        }
      };

      wsRef.current.onmessage = (event) => {
        if (!isMounted.current) return;
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ WebSocket parse error:', error);
        }
      };

      wsRef.current.onerror = (event) => {
        if (!isMounted.current) return;
        console.error('❌ WebSocket ERROR:', event);
        isConnecting.current = false;
        if (!isConnected) {
          setError('Connection error. Please check server.');
        }
      };

      wsRef.current.onclose = (event) => {
        if (!isMounted.current) return;
        console.log('🔌 WebSocket CLOSED:', event.code, event.reason || 'No reason');
        setIsConnected(false);
        setIsAuthenticated(false);
        setIsCapturing(false);
        isConnecting.current = false;

        setScannerStatus((prev) => ({
          ...prev,
          status: 'offline',
          deviceConnected: false,
          lastUpdated: new Date().toISOString(),
        }));

        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * reconnectAttempts.current, 5000);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              connect();
            }
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('❌ Max reconnect attempts reached');
          setError('Could not connect to scanner. Please refresh the page.');
        }
      };
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      setError('Failed to connect to WebSocket server');
      isConnecting.current = false;
    }
  }, [token, handleWebSocketMessage, cleanup]);

  // ============================================
  // Start Capture – with status checks
  // ============================================
  const startCapture = useCallback(
    (fingerType = 'right_thumb') => {
      console.log('▶️ startCapture:', fingerType);
      console.log('📟 Current scanner status:', scannerStatus);

      if (!isConnected) {
        setError('Scanner not connected');
        return;
      }

      // ✅ Check if scanner is ready
      if (!scannerStatus.deviceConnected) {
        setError('Scanner is not ready. Please wait...');
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'start_capture',
            payload: { fingerType, timeout: 30000 },
          })
        );
      } else {
        setError('WebSocket is not open');
      }
    },
    [isConnected, scannerStatus]
  );

  // ============================================
  // Stop Capture
  // ============================================
  const stopCapture = useCallback(() => {
    if (isConnected && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop_capture' }));
    }
  }, [isConnected]);

  // ============================================
  // Helper Functions
  // ============================================
  const getScannerStatus = useCallback(() => scannerStatus, [scannerStatus]);
  const isScannerReady = useCallback(() => {
    return isConnected && scannerStatus.isReady && scannerStatus.deviceConnected;
  }, [isConnected, scannerStatus]);

  const clearError = useCallback(() => setError(null), []);

  // ============================================
  // Connect on Mount – ONLY ONCE
  // ============================================
  useEffect(() => {
    isMounted.current = true;
    console.log('🔄 useFingerprintWebSocket: Initializing...');
    connect();

    return () => {
      isMounted.current = false;
      isConnecting.current = false;
      cleanup();
    };
  }, []);

  // ============================================
  // Return API
  // ============================================
  return {
    isConnected,
    isAuthenticated,
    error,
    connect,
    reconnect: connect,
    scannerStatus,
    getScannerStatus,
    isScannerReady,
    isCapturing,
    captureProgress,
    fingerprintData,
    liveData,
    startCapture,
    stopCapture,
    clearError,
  };
};

export default useFingerprintWebSocket;