import React, { useRef, useEffect, useState } from 'react';

export const LivePreview = ({ isActive = false, fingerprintData = null, className = '' }) => {
  const canvasRef = useRef(null);
  const [animationId, setAnimationId] = useState(null);

  // Simulate live preview with animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let frameCount = 0;

    const drawPreview = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw fingerprint pattern
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (fingerprintData) {
        // Draw captured fingerprint
        ctx.fillStyle = '#000';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✅ Fingerprint Captured', canvas.width / 2, canvas.height / 2);
        
        // Draw quality indicator
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(50, canvas.height - 30, 200, 10);
        ctx.fillStyle = '#166534';
        ctx.font = '12px sans-serif';
        ctx.fillText('Quality: 98%', 50, canvas.height - 35);
      } else if (isActive) {
        // Animated scanning effect
        const time = Date.now() / 1000;
        const x = Math.sin(time * 2) * 50 + canvas.width / 2;
        const y = Math.cos(time * 1.5) * 30 + canvas.height / 2;

        // Draw moving scan line
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.3, 'rgba(14, 165, 233, 0.3)');
        gradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.8)');
        gradient.addColorStop(0.7, 'rgba(14, 165, 233, 0.3)');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, y - 2, canvas.width, 4);

        // Draw fingerprint ridges (simulated)
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
          const cy = i * 12 + (Math.sin(time + i) * 3);
          ctx.beginPath();
          ctx.arc(canvas.width / 2 + Math.sin(time + i * 0.5) * 40, cy, 60 + Math.sin(time * 0.5 + i) * 10, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw scanning indicator
        ctx.fillStyle = '#0ea5e9';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔄 Scanning...', canvas.width / 2, 30);

        frameCount++;
        const newAnimationId = requestAnimationFrame(drawPreview);
        setAnimationId(newAnimationId);
        return;
      } else {
        // Idle state
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🖐️ Place finger on scanner', canvas.width / 2, canvas.height / 2);
      }

      const newAnimationId = requestAnimationFrame(drawPreview);
      setAnimationId(newAnimationId);
    };

    drawPreview();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isActive, fingerprintData]);

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="w-full h-auto"
      />
      <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
        <span className="text-xs text-gray-600">
          {isActive ? 'Live Preview' : fingerprintData ? 'Captured Fingerprint' : 'Scanner Ready'}
        </span>
      </div>
    </div>
  );
};