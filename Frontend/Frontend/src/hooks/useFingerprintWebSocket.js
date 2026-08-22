// client/src/hooks/useFingerprintWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const useFingerprintWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [fingerprintData, setFingerprintData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = 'ws://localhost:5000/ws/fingerprint';
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('🔗 WebSocket connected');
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
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
      setError('Connection error. Please check scanner.');
    };

    wsRef.current.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
      setIsCapturing(false);
      attemptReconnect();
    };
  }, []);

  const attemptReconnect = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      setTimeout(() => {
        console.log(`🔄 Reconnecting attempt ${reconnectAttempts.current}...`);
        connect();
      }, 2000 * reconnectAttempts.current);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connected':
        console.log('✅ Scanner ready:', data.payload);
        break;

      case 'capture_started':
        setIsCapturing(true);
        setCaptureProgress(0);
        break;

      case 'capture_progress':
        setCaptureProgress(data.payload.progress);
        setLiveData(data.payload);
        // 🔥 Pass raw fingerprint data for visualization
        if (data.payload.imageData) {
          setFingerprintData(data.payload);
        }
        break;

      case 'capture_complete':
        setIsCapturing(false);
        setCaptureProgress(100);
        setFingerprintData(data.payload);
        // Notify parent
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

    wsRef.current.send(JSON.stringify({
      type: 'start_capture',
      payload: { fingerType }
    }));
  }, [isConnected]);

  const stopCapture = useCallback(() => {
    if (isConnected && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_capture'
      }));
    }
  }, [isConnected]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    isCapturing,
    captureProgress,
    fingerprintData,
    liveData,
    error,
    startCapture,
    stopCapture,
    connect
  };
};