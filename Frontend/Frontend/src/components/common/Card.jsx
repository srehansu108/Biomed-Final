import React from 'react';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-card p-6
        ${hover ? 'hover:shadow-card-hover transition-shadow duration-300' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};