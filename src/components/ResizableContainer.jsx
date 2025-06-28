import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';

const ResizableContainer = ({ children }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const timeoutRef = useRef(null);

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.round(width), height: Math.round(height) });
      setVisible(true);
      setFading(false);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setFading(true);
      }, 2000);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="seam-container-resizable">
      {children}
      {visible && (
        <div
          className={`resize-indicator ${fading ? 'fade-out' : ''}`}
          onAnimationEnd={() => {
            if (fading) setVisible(false);
          }}
        >
          {dimensions.width} &times; {dimensions.height}
        </div>
      )}
    </div>
  );
};

export default ResizableContainer;
