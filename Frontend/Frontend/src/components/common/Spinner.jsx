import React from 'react';

export const Spinner = ({ size = 'md', color = 'biomed-green', className = '' }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          ${sizes[size]}
          border-4 border-${color} border-t-transparent rounded-full animate-spin
        `}
      />
    </div>
  );
};