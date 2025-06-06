import React, { useState } from 'react';
import ImageUploader from './ImageUploader.jsx';

function Controls({ config, setConfig, onImageUpload }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleConfigChange = (key, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [key]: value
    }));
  };

  return (
    <div className="controls-container">
      <div className="config-tab" onClick={() => setIsCollapsed(!isCollapsed)}>
        Config {isCollapsed ? '▲' : '▼'}
      </div>
      {!isCollapsed && (
        <div className="controls-panel">
          <div className="control-group">
            <ImageUploader onImageUpload={onImageUpload} />
          </div>
          <div className="control-group">
            <label>Max scale down: {config.scaleDown}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.scaleDown}
              onChange={(e) => handleConfigChange('scaleDown', e.target.value)}
            />
          </div>
          <div className="control-group">
            <label>Max scale up: {config.scaleUp}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.scaleUp}
              onChange={(e) => handleConfigChange('scaleUp', e.target.value)}
            />
          </div>
          <div className="control-group">
            <label>Seam generation:</label>
            <div className="toggle-switch">
              <button
                className={config.seamMode === 'fast' ? 'active' : ''}
                onClick={() => handleConfigChange('seamMode', 'fast')}
              >
                Fast
              </button>
              <button
                className={config.seamMode === 'accurate' ? 'active' : ''}
                onClick={() => handleConfigChange('seamMode', 'accurate')}
              >
                Accurate
              </button>
              <button
                className={config.seamMode === 'cached' ? 'active' : ''}
                onClick={() => handleConfigChange('seamMode', 'cached')}
              >
                Cached
              </button>
            </div>
          </div>
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={config.showSeams}
                onChange={(e) => handleConfigChange('showSeams', e.target.checked)}
              />
              Show Seams
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default Controls; 