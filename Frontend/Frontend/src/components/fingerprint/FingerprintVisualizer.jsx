// client/src/components/fingerprint/FingerprintVisualizer.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * 🔥 Real-time fingerprint visualization from raw data
 * Supports:
 * - Live scanning animation
 * - Raw fingerprint image rendering
 * - Minutiae point overlay
 * - Quality heatmap
 * - Real vs Simulated mode indicator
 */
export const FingerprintVisualizer = ({
  imageData,      // Base64 image from scanner
  minutiae = [],  // Minutiae points
  quality = 0,    // Quality score
  isCapturing = false,
  progress = 0,
  className = '',
  width = 400,
  height = 400,
  showMinutiae = true,
  showHeatmap = false,
  mode = 'simulated', // 'real' or 'simulated'
  sourceLabel = '🟡 SIMULATED',
  onFingerDetected = () => {}
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [scanLinePosition, setScanLinePosition] = useState(0);

  // 🔥 RENDER FINGERPRINT FROM RAW DATA
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Draw background
    const gradient = ctx.createRadialGradient(
      width/2, height/2, 0,
      width/2, height/2, width/2
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 🔥 CASE 1: Render actual fingerprint image
    if (imageData) {
      const img = new Image();
      img.onload = () => {
        // Draw the fingerprint image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Overlay quality indicator
        drawQualityOverlay(ctx, quality);
        
        // 🔥 Draw minutiae points
        if (showMinutiae && minutiae.length > 0) {
          drawMinutiae(ctx, minutiae, width, height);
        }

        // 🔥 Draw heatmap overlay
        if (showHeatmap) {
          drawHeatmap(ctx, minutiae, width, height);
        }

        // 🔥 Draw mode indicator on image
        drawModeIndicator(ctx, mode, width, height);
      };
      img.src = `data:image/bmp;base64,${imageData}`;
    } 
    // 🔥 CASE 2: Live scanning animation
    else if (isCapturing) {
      drawLiveScanning(ctx, width, height, progress, mode);
    }
    // 🔥 CASE 3: Placeholder - waiting for finger
    else {
      drawPlaceholder(ctx, width, height);
    }

    // 🔥 Animate scanning line
    if (isCapturing) {
      let frame = 0;
      const animate = () => {
        frame++;
        setScanLinePosition((frame % 120) / 120);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [imageData, minutiae, quality, isCapturing, progress, showMinutiae, showHeatmap, width, height, mode]);

  // 🎯 Draw minutiae points
  const drawMinutiae = (ctx, minutiae, width, height) => {
    minutiae.forEach(point => {
      const x = (point.x / 300) * width;
      const y = (point.y / 300) * height;
      
      // Different colors for different types
      const color = point.type === 'ridge_ending' ? '#ff6b6b' : '#4ecdc4';
      
      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw angle direction
      const angle = point.angle || 0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '8px monospace';
      ctx.fillText(point.type === 'ridge_ending' ? '⨯' : '◉', x + 8, y - 5);
    });
  };

  // 🔥 Draw heatmap from minutiae density
  const drawHeatmap = (ctx, minutiae, width, height) => {
    if (minutiae.length < 3) return;

    // Create heatmap grid
    const gridSize = 20;
    const cols = Math.floor(width / gridSize);
    const rows = Math.floor(height / gridSize);
    const density = new Array(rows).fill().map(() => new Array(cols).fill(0));

    minutiae.forEach(point => {
      const col = Math.floor((point.x / 300) * cols);
      const row = Math.floor((point.y / 300) * rows);
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        density[row][col]++;
      }
    });

    // Draw heatmap
    const maxDensity = Math.max(...density.flat());
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const value = density[row][col] / (maxDensity || 1);
        if (value > 0.1) {
          const x = col * gridSize;
          const y = row * gridSize;
          ctx.fillStyle = `rgba(255, 100, 0, ${value * 0.3})`;
          ctx.fillRect(x, y, gridSize, gridSize);
        }
      }
    }
  };

  // 🔥 Draw quality overlay
  const drawQualityOverlay = (ctx, quality) => {
    const color = quality > 85 ? '#22c55e' : quality > 70 ? '#eab308' : '#ef4444';
    
    // Quality bar at bottom
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(20, height - 40, width - 40, 12);
    
    ctx.fillStyle = color;
    ctx.fillRect(22, height - 38, (quality / 100) * (width - 44), 8);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(quality)}%`, width - 30, height - 50);
    ctx.textAlign = 'left';
    ctx.fillText('Quality', 25, height - 50);
  };

  // 🔥 Draw mode indicator on captured image
  const drawModeIndicator = (ctx, mode, width, height) => {
    const isReal = mode === 'real';
    const color = isReal ? 'rgba(34, 197, 94, 0.8)' : 'rgba(234, 179, 8, 0.8)';
    const borderColor = isReal ? '#22c55e' : '#eab308';
    const label = isReal ? '🔴 REAL CAPTURE' : '🟡 SIMULATED';
    
    // Draw badge background
    const badgeWidth = 140;
    const badgeHeight = 30;
    const x = width - badgeWidth - 15;
    const y = 15;
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(x, y, badgeWidth, badgeHeight, 8);
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, badgeWidth, badgeHeight, 8);
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = color;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + badgeWidth/2, y + badgeHeight/2);
  };

  // 🔥 Draw live scanning animation
  const drawLiveScanning = (ctx, width, height, progress, mode) => {
    const isReal = mode === 'real';
    const scanColor = isReal ? '#0ea5e9' : '#eab308';
    const glowColor = isReal ? 'rgba(14, 165, 233, 0.3)' : 'rgba(234, 179, 8, 0.3)';
    
    // Animated ridges
    const time = Date.now() / 1000;
    ctx.save();

    // Draw fingerprint ridges
    for (let i = 0; i < 30; i++) {
      const y = i * 13 + Math.sin(time + i * 0.5) * 4;
      const xOffset = Math.sin(time * 0.3 + i * 0.3) * 20;
      
      ctx.beginPath();
      ctx.moveTo(20 + xOffset, y);
      for (let x = 20; x < width - 20; x += 2) {
        const wave = Math.sin(x * 0.02 + time * 2 + i * 0.2) * 10;
        ctx.lineTo(x, y + wave);
      }
      ctx.strokeStyle = `rgba(200, 200, 255, ${0.2 + (i / 30) * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 🔥 Scanning line effect
    const scanY = (progress / 100) * height;
    const gradient = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    gradient.addColorStop(0, 'rgba(14, 165, 233, 0)');
    gradient.addColorStop(0.5, glowColor);
    gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, scanY - 30, width, 60);

    // Bright scan line
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(width, scanY);
    ctx.strokeStyle = scanColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = scanColor;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Mode label on scan line
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      isReal ? '🔴 REAL SCANNER' : '🟡 SIMULATED',
      width/2, 
      Math.min(scanY - 10, height - 20)
    );

    // Progress text
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`🔄 Scanning... ${Math.round(progress)}%`, width/2, height - 20);

    ctx.restore();
  };

  // 🔥 Draw placeholder
  const drawPlaceholder = (ctx, width, height) => {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🖐️', width/2, height/2 - 20);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '16px sans-serif';
    ctx.fillText('Place finger on scanner', width/2, height/2 + 50);
  };

  // Helper for roundRect
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    return this;
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto rounded-lg shadow-2xl"
        style={{ background: '#0f0f1f' }}
      />
      
      {/* 🔥 Status overlays */}
      {isCapturing && (
        <div className="absolute top-4 left-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            mode === 'real' 
              ? 'bg-green-500/20 border-green-500/30' 
              : 'bg-yellow-500/20 border-yellow-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              mode === 'real' ? 'bg-green-500' : 'bg-yellow-500'
            } animate-pulse`} />
            <span className={`text-xs font-bold ${
              mode === 'real' ? 'text-green-300' : 'text-yellow-300'
            }`}>
              {mode === 'real' ? '🔴 REAL' : '🟡 SIMULATED'}
            </span>
          </div>
        </div>
      )}
      
      {imageData && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-300 font-bold">✓ CAPTURED</span>
          </div>
        </div>
      )}

      {/* Source label overlay when not capturing */}
      {!isCapturing && !imageData && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <div className={`px-4 py-2 rounded-full text-xs font-bold ${
            mode === 'real' 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
          }`}>
            {sourceLabel}
          </div>
        </div>
      )}
    </div>
  );
};

export default FingerprintVisualizer;