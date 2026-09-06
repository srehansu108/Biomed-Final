// client/src/components/fingerprint/FingerSelector.jsx

import React from 'react';

export const FingerSelector = ({ 
  fingers, 
  selectedFinger, 
  onSelect, 
  disabled = false 
}) => {
  // Group fingers by hand
  const rightHand = fingers.filter(f => f.id.startsWith('right_'));
  const leftHand = fingers.filter(f => f.id.startsWith('left_'));

  return (
    <div className="space-y-4">
      {/* Right Hand */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Right Hand
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {rightHand.map((finger) => (
            <FingerButton
              key={finger.id}
              finger={finger}
              isSelected={selectedFinger?.id === finger.id}
              onSelect={() => onSelect(finger)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* Left Hand */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Left Hand
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {leftHand.map((finger) => (
            <FingerButton
              key={finger.id}
              finger={finger}
              isSelected={selectedFinger?.id === finger.id}
              onSelect={() => onSelect(finger)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ✅ Individual Finger Button
const FingerButton = ({ finger, isSelected, onSelect, disabled }) => {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center
        p-3 rounded-lg border-2 transition-all duration-200
        ${isSelected 
          ? 'border-biomed-green bg-biomed-green/10 shadow-md ring-2 ring-biomed-green/30' 
          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
      `}
      aria-label={`Select ${finger.label}`}
      title={finger.description}
    >
      <span className="text-2xl mb-1">{finger.icon}</span>
      <span className={`text-xs font-medium ${isSelected ? 'text-biomed-green' : 'text-gray-600'}`}>
        {finger.label.replace('Right ', '').replace('Left ', '')}
      </span>
      {isSelected && (
        <span className="text-[10px] text-biomed-green mt-0.5 font-semibold">✓ Selected</span>
      )}
    </button>
  );
};