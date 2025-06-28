import React, { useRef, useState, useLayoutEffect } from 'react';

const ResizableContainer = ({ children }) => {
  const containerRef = useRef(null);
  const rightHandleRef = useRef(null);
  const bottomHandleRef = useRef(null);
  const cornerHandleRef = useRef(null);

  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const timeoutRef = useRef(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const rightHandle = rightHandleRef.current;
    const bottomHandle = bottomHandleRef.current;
    const cornerHandle = cornerHandleRef.current;

    if (!container || !rightHandle || !bottomHandle || !cornerHandle) return;

    const state = {
      isResizing: false,
      handle: null,
      width: 0,
      height: 0,
      lastMouseX: 0,
      lastMouseY: 0,
    };

    const handleMouseMove = (e) => {
      if (!state.isResizing) return;
      const dx = e.clientX - state.lastMouseX;
      const dy = e.clientY - state.lastMouseY;

      let newWidth = state.width;
      let newHeight = state.height;

      if (state.handle.includes('right') || state.handle.includes('corner')) newWidth += dx;
      if (state.handle.includes('bottom') || state.handle.includes('corner')) newHeight += dy;

      if (e.shiftKey) {
        newWidth = Math.round(newWidth / 10) * 10;
        newHeight = Math.round(newHeight / 10) * 10;
      }

      const maxWidth = container.parentElement.clientWidth - 20;
      const maxHeight = container.parentElement.clientHeight - 20;
      newWidth = Math.min(newWidth, maxWidth);
      newHeight = Math.min(newHeight, maxHeight);

      container.style.width = `${newWidth}px`;
      container.style.height = `${newHeight}px`;

      state.width = newWidth;
      state.height = newHeight;
      setDisplaySize({ width: newWidth, height: newHeight });

      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      state.isResizing = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setFading(true), 2000);
    };

    const handleMouseDown = (e, handle) => {
      e.preventDefault();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      state.isResizing = true;
      state.handle = handle;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      setVisible(true);
      setFading(false);
    };

    const handleWindowResize = () => {
      if (!container.parentElement) return;
      const parent = container.parentElement;
      const newWidth = parent.clientWidth - 20;
      const newHeight = parent.clientHeight - 20;

      state.width = newWidth;
      state.height = newHeight;
      container.style.width = `${newWidth}px`;
      container.style.height = `${newHeight}px`;

      setDisplaySize({ width: newWidth, height: newHeight });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setVisible(true);
      setFading(false);
      timeoutRef.current = setTimeout(() => setFading(true), 2000);
    };

    handleWindowResize();

    const onRightMouseDown = (e) => handleMouseDown(e, 'right');
    const onBottomMouseDown = (e) => handleMouseDown(e, 'bottom');
    const onCornerMouseDown = (e) => handleMouseDown(e, 'corner');

    rightHandle.addEventListener('mousedown', onRightMouseDown);
    bottomHandle.addEventListener('mousedown', onBottomMouseDown);
    cornerHandle.addEventListener('mousedown', onCornerMouseDown);
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleWindowResize);
      if (rightHandle) rightHandle.removeEventListener('mousedown', onRightMouseDown);
      if (bottomHandle) bottomHandle.removeEventListener('mousedown', onBottomMouseDown);
      if (cornerHandle) cornerHandle.removeEventListener('mousedown', onCornerMouseDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="seam-container-resizable">
      <div className="resizable-content">{children}</div>
      {visible && (
        <div
          className={`resize-indicator ${fading ? 'fade-out' : ''}`}
          onAnimationEnd={() => {
            if (fading) setVisible(false);
          }}
        >
          {Math.round(displaySize.width)} &times; {Math.round(displaySize.height)}
        </div>
      )}
      <div ref={rightHandleRef} className="resize-handle-right">
        <div className="handle-dots handle-dots-vertical">
          <span>&middot;</span>
          <span>&middot;</span>
          <span>&middot;</span>
        </div>
      </div>
      <div ref={bottomHandleRef} className="resize-handle-bottom">
        <div className="handle-dots handle-dots-horizontal">
          <span>&middot;</span>
          <span>&middot;</span>
          <span>&middot;</span>
        </div>
      </div>
      <div ref={cornerHandleRef} className="resize-handle-corner" />
    </div>
  );
};

export default ResizableContainer;
