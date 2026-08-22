import React from 'react';

export const CaptureGuide = ({ fingerType = 'right_thumb', className = '' }) => {
  const tips = [
    'Place your finger flat on the scanner',
    'Apply normal pressure (not too hard, not too soft)',
    'Ensure good lighting',
    'Keep fingers clean and dry',
    'Stay still during capture',
  ];

  const fingerImages = {
    right_thumb: '👍',
    right_index: '👆',
    right_middle: '🖕',
    right_ring: '🖖',
    right_little: '🤙',
  };

  return (
    <div className={`p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-4xl">{fingerImages[fingerType] || '🖐️'}</div>
        <div>
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Tips for Best Results</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};