import React from 'react';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
}

export const Keypad: React.FC<KeypadProps> = ({ onKeyPress, onDelete }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'];

  return (
    <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
      {keys.map((key, idx) => {
        if (key === '') return <div key={idx} />;
        if (key === 'DEL') {
          return (
            <button
              key={idx}
              onClick={onDelete}
              className="h-14 rounded-2xl bg-surface border border-border font-bold text-sm active:scale-95 transition-transform"
              aria-label="Delete character"
            >
              âŒ«
            </button>
          );
        }
        return (
          <button
            key={idx}
            onClick={() => onKeyPress(key)}
            className="h-14 rounded-2xl bg-surface border border-border font-bold text-lg active:scale-95 transition-transform"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
};
