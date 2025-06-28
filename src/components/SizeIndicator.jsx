import React, { useState, useEffect, useRef } from 'react';

const SizeIndicator = ({ size, onSizeChange, show }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editSize, setEditSize] = useState(size);
  const [showClass, setShowClass] = useState(false);
  const timeoutRef = useRef(null);
  const widthInputRef = useRef(null);
  const heightInputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setEditSize(size);
    }
  }, [size, isEditing]);

  useEffect(() => {
    if (show) {
      setShowClass(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (!isEditing) {
          setShowClass(false);
        }
      }, 2000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [show, size, isEditing]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isEditing) {
      setIsEditing(true);
      setShowClass(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (
        document.activeElement !== widthInputRef.current &&
        document.activeElement !== heightInputRef.current
      ) {
        onSizeChange(editSize);
        setIsEditing(false);
        setShowClass(false);
      }
    }, 0);
  };

  const handleInputChange = (e, dimension) => {
    const value = parseInt(e.target.value, 10);
    setEditSize((prev) => ({ ...prev, [dimension]: isNaN(value) ? 0 : value }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSizeChange(editSize);
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditSize(size);
      setIsEditing(false);
    }
  };

  return (
    <div className={`resize-indicator ${showClass ? 'show' : ''}`} onClick={handleClick}>
      {isEditing ? (
        <>
          <input
            ref={widthInputRef}
            type="number"
            value={Math.round(editSize.width)}
            onChange={(e) => handleInputChange(e, 'width')}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.stopPropagation()}
          />
          &nbsp;&times;&nbsp;
          <input
            ref={heightInputRef}
            type="number"
            value={Math.round(editSize.height)}
            onChange={(e) => handleInputChange(e, 'height')}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        </>
      ) : (
        <>
          {Math.round(size.width)} &times; {Math.round(size.height)}
        </>
      )}
    </div>
  );
};

export default SizeIndicator;
