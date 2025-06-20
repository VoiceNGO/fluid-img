import React, { useLayoutEffect, useRef } from 'react';

const ResizableContainer = ({ children }) => {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const updateMaxSize = () => {
      const container = containerRef.current;
      if (container && container.parentElement) {
        const parent = container.parentElement;
        const maxWidth = parent.clientWidth - 20;
        const maxHeight = parent.clientHeight - 20;
        container.style.maxWidth = `${maxWidth}px`;
        container.style.maxHeight = `${maxHeight}px`;
      }
    };

    updateMaxSize();

    window.addEventListener('resize', updateMaxSize);

    return () => {
      window.removeEventListener('resize', updateMaxSize);
    };
  }, []);

  return (
    <div ref={containerRef} className="seam-container-resizable">
      {children}
    </div>
  );
};

export default ResizableContainer; 