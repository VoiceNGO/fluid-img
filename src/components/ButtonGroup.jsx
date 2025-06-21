import React from 'react';

export const ButtonGroup = ({ options, selectedValue, onSelect, disabledOptions = [] }) => {
  return (
    <div className="button-group">
      {Object.entries(options).map(([key, value]) => (
        <button
          key={value}
          className={selectedValue === value ? 'active' : ''}
          onClick={() => onSelect(value)}
          disabled={disabledOptions.includes(value)}
        >
          {key.charAt(0).toUpperCase() + key.slice(1)}
        </button>
      ))}
    </div>
  );
};
