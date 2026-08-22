import React from 'react';

export const ProgressBar = ({ value, max = 100, label, showPercentage = true, className = '' }) => {
  const percentage = Math.min((value / max) * 100, 100);

  const getColor = () => {
    if (percentage >= 85) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};