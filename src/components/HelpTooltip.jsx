import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const HelpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="help-icon"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

function HelpTooltip({ children }) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  const handleMouseEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setIsTooltipVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsTooltipVisible(false);
  };

  const isComponent = typeof children !== 'string';
  const tooltipClassName = `tooltip-text ${isComponent ? 'tooltip-component' : ''}`;

  return (
    <>
      <div
        className="help-tooltip"
        ref={iconRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <HelpIcon />
      </div>
      {isTooltipVisible &&
        createPortal(
          <div
            className={tooltipClassName}
            style={{
              position: 'absolute',
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 9999,
            }}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  );
}

export default HelpTooltip; 