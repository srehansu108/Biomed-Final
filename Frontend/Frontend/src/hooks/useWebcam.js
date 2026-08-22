import { useState, useRef, useCallback } from 'react';

export const useWebcam = () => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const webcamRef = useRef(null);

  const startCamera = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  const stopCamera = useCallback(() => {
    setIsCameraReady(false);
    // Stop all tracks if webcam is active
    if (webcamRef.current && webcamRef.current.stream) {
      const tracks = webcamRef.current.stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      setIsCapturing(true);
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setIsCapturing(false);
      return imageSrc;
    }
    return null;
  }, []);

  const resetCapture = useCallback(() => {
    setCapturedImage(null);
  }, []);

  return {
    webcamRef,
    isCameraReady,
    capturedImage,
    isCapturing,
    startCamera,
    stopCamera,
    capturePhoto,
    resetCapture,
  };
};