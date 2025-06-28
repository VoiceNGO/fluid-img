import React, { useRef, useState, useLayoutEffect } from 'react';
import SizeIndicator from './SizeIndicator';

const ResizableContainer = ({ children }) => {
  const containerRef = useRef(null);
  const rightHandleRef = useRef(null);
  const bottomHandleRef = useRef(null);
  const cornerHandleRef = useRef(null);

  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [showIndicator, setShowIndicator] = useState(false);

  const stateRef = useRef({
    isResizing: false,
    handle: null,
    userWidth: 2000,
    userHeight: 2000,
    maxWidth: Infinity,
    maxHeight: Infinity,
    initialUserWidth: 0,
    initialUserHeight: 0,
    initialMouseX: 0,
    initialMouseY: 0,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const rightHandle = rightHandleRef.current;
    const bottomHandle = bottomHandleRef.current;
    const cornerHandle = cornerHandleRef.current;
    const state = stateRef.current;

    if (!container || !rightHandle || !bottomHandle || !cornerHandle) return;

    const triggerIndicator = () => {
      setShowIndicator(false);
      setShowIndicator(true);
    };

    const applySize = () => {
      const newWidth = Math.min(state.userWidth, state.maxWidth);
      const newHeight = Math.min(state.userHeight, state.maxHeight);
      container.style.width = `${newWidth}px`;
      container.style.height = `${newHeight}px`;
      setDisplaySize({ width: newWidth, height: newHeight });
    };

    const handleMouseMove = (e) => {
      if (!state.isResizing) return;
      const totalDx = e.clientX - state.initialMouseX;
      const totalDy = e.clientY - state.initialMouseY;

      let newWidth = state.initialUserWidth;
      let newHeight = state.initialUserHeight;

      if (state.handle.includes('right') || state.handle.includes('corner')) newWidth += totalDx;
      if (state.handle.includes('bottom') || state.handle.includes('corner')) newHeight += totalDy;

      if (e.shiftKey) {
        newWidth = Math.round(newWidth / 10) * 10;
        newHeight = Math.round(newHeight / 10) * 10;
      }
      state.userWidth = newWidth;
      state.userHeight = newHeight;
      applySize();
    };

    const handleMouseUp = () => {
      state.isResizing = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      triggerIndicator();
    };

    const handleMouseDown = (e, handle) => {
      e.preventDefault();
      state.isResizing = true;
      state.handle = handle;
      state.initialUserWidth = parseFloat(container.style.width);
      state.initialUserHeight = parseFloat(container.style.height);
      state.initialMouseX = e.clientX;
      state.initialMouseY = e.clientY;

      window.removeEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      triggerIndicator();
    };

    const handleWindowResize = () => {
      if (!container.parentElement) return;
      const parent = container.parentElement;
      state.maxWidth = parent.clientWidth - 20;
      state.maxHeight = parent.clientHeight - 20;
      applySize();
      triggerIndicator();
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

  const handleSizeChange = (newSize) => {
    const container = containerRef.current;
    const state = stateRef.current;
    if (!container || !container.parentElement) return;

    const maxWidth = container.parentElement.clientWidth - 20;
    const maxHeight = container.parentElement.clientHeight - 20;
    const newWidth = Math.min(newSize.width, maxWidth);
    const newHeight = Math.min(newSize.height, maxHeight);

    container.style.width = `${newWidth}px`;
    container.style.height = `${newHeight}px`;

    state.userWidth = newWidth;
    state.userHeight = newHeight;

    setDisplaySize({ width: newWidth, height: newHeight });
  };

  return (
    <div ref={containerRef} className="seam-container-resizable">
      <div className="resizable-content">{children}</div>
      <SizeIndicator size={displaySize} onSizeChange={handleSizeChange} show={showIndicator} />
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
