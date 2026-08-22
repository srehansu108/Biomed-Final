// client/src/components/fingerprint/QualityIndicator.jsx
import React from 'react';

export const QualityIndicator = ({ quality }) => {
  const getQualityColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            quality >= 85 ? 'bg-green-500' :
            quality >= 70 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${quality}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${getQualityColor(quality)}`}>
        {getQualityLabel(quality)} ({quality}%)
      </span>
    </div>
  );
};