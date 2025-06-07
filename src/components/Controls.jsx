import React, { useState } from 'react';
import ImageUploader from './ImageUploader.jsx';
import HelpTooltip from './HelpTooltip.jsx';

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
            <label>
              Max carve down: {config.scaleDown}%
              <HelpTooltip>Only use seam carving to shrink down to this percentage of original width. After that, normal image scaling is used.</HelpTooltip>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.scaleDown}
              onChange={(e) => handleConfigChange('scaleDown', e.target.value)}
            />
          </div>
          <div className="control-group">
            <label>
              Max carve up: {config.scaleUp}%
              <HelpTooltip>Only use seam carving to enlarge up to this percentage past the original width. After that, normal image scaling is used.</HelpTooltip>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.scaleUp}
              onChange={(e) => handleConfigChange('scaleUp', e.target.value)}
            />
          </div>
          <div className="control-group">
            <label>
              Seam generation:
              <HelpTooltip>{`Fast: Picks the best from randomly generated seams.
              
              Accurate: Precise seam calculation.  Much slower.
              
              Cached: Uses pre-computed seams for the best speed and quality, but requires an extra download.`}</HelpTooltip>
            </label>
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
              Animate Seam Carving
              <HelpTooltip>
                <img src="images/fight.gif" alt="Animation" />
              </HelpTooltip>
            </label>
          </div>
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={config.showEnergyMap}
                onChange={(e) => handleConfigChange('showEnergyMap', e.target.checked)}
              />
              Show Energy Map
              <HelpTooltip>Displays a grayscale 'energy map' of the image. Darker areas have lower energy and are more likely to be carved out by seams. Lighter areas are protected.</HelpTooltip>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default Controls; 