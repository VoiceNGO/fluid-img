import React, { useEffect, useRef, useState } from 'react';
import Draggable from '../Draggable';
import './log-window.css';

function LogWindow({ logs }) {
  const [isVisible, setIsVisible] = useState(true);
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isVisible) return null;

  return (
    <Draggable>
      <div className="log-window-container">
        <div onClick={() => setIsVisible(false)} className="log-window-close">
          X
        </div>
        <div className="log-window" ref={logContainerRef}>
          {logs.map((log, index) => (
            <div key={index} className="log-window-message">
              {log}
            </div>
          ))}
        </div>
      </div>
    </Draggable>
  );
}

export default LogWindow;
