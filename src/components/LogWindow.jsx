import React, { useEffect, useRef, useState } from 'react';

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
    <div className="log-window-container">
      <div onClick={() => setIsVisible(false)} className="log-window-close">
        X
      </div>
      <div className="log-window" ref={logContainerRef}>
        {logs.map((log, index) => (
          <div key={index} className="log-message">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogWindow;