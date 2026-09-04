// client/src/hooks/useFingerprintWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';

// ✅ Get WebSocket URL dynamically
const getWebSocketUrl = () => {
  // Use environment variable or construct from current host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.REACT_APP_API_HOST || window.location.hostname;
  const port = process.env.REACT_APP_WS_PORT || '8000';
  
  // Use REACT_APP_WS_URL if set, otherwise construct
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }
  
  return `${protocol}//${host}:${port}/ws/fingerprint`;
};

export const useFingerprintWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [fingerprintData, setFingerprintData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const token = localStorage.getItem('token');

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = getWebSocketUrl();
      console.log('🔗 Connecting to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.binaryType = 'arraybuffer';

      wsRef.current.onopen = () => {
        console.log('🔗 WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        
        // ✅ Authenticate if token exists
        if (token) {
          wsRef.current.send(JSON.stringify({
            type: 'authenticate',
            payload: { token }
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (!isConnected) {
          setError('Connection error. Please check server.');
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        setIsCapturing(false);
        setIsAuthenticated(false);
        attemptReconnect();
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setError('Failed to connect to WebSocket server');
      attemptReconnect();
    }
  }, [token]);

  const attemptReconnect = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
      console.log(`🔄 Reconnecting attempt ${reconnectAttempts.current} in ${delay}ms...`);
      setTimeout(() => {
        connect();
      }, delay);
    } else {
      setError('Failed to connect after multiple attempts. Please check server.');
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connected':
        console.log('✅ Scanner ready:', data.payload);
        setIsConnected(true);
        break;

      case 'authenticated':
        if (data.payload.status === 'success') {
          setIsAuthenticated(true);
          console.log('✅ WebSocket authenticated as user:', data.payload.userId);
        } else {
          setError(data.payload.error || 'Authentication failed');
        }
        break;

      case 'capture_started':
        setIsCapturing(true);
        setCaptureProgress(0);
        break;

      case 'capture_progress':
        setCaptureProgress(data.payload.progress);
        setLiveData(data.payload);
        if (data.payload.imageData) {
          setFingerprintData(data.payload);
        }
        break;

      case 'capture_complete':
        setIsCapturing(false);
        setCaptureProgress(100);
        setFingerprintData(data.payload);
        break;

      case 'capture_error':
        setIsCapturing(false);
        setError(data.payload.error);
        break;

      case 'capture_stopped':
        setIsCapturing(false);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const startCapture = useCallback((fingerType = 'right_thumb') => {
    if (!isConnected) {
      setError('Scanner not connected');
      return;
    }

    if (!isAuthenticated) {
      setError('Please authenticate first');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'start_capture',
        payload: { fingerType }
      }));
    } else {
      setError('WebSocket is not open');
    }
  }, [isConnected, isAuthenticated]);

  const stopCapture = useCallback(() => {
    if (isConnected && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_capture'
      }));
    }
  }, [isConnected]);

  // ✅ Reconnect on token change
  useEffect(() => {
    if (token) {
      connect();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token, connect]);

  return {
    isConnected,
    isAuthenticated,
    isCapturing,
    captureProgress,
    fingerprintData,
    liveData,
    error,
    startCapture,
    stopCapture,
    connect,
    reconnect: connect
  };
};