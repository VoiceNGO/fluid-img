import React, { useState } from 'react';
import ImageUploader from './ImageUploader.jsx';
import HelpTooltip from './HelpTooltip.jsx';
import { ScalingAxis } from '../../../src/utils/enums/enums';
import { ButtonGroup } from './ButtonGroup';

const Generator = {
  Random: 'random',
  Predictive: 'predictive',
  Cached: 'cached',
  Full: 'full',
};

const DisplayMode = {
  Image: '',
  Energy: 'energy',
  "B/W": 'grayscale',
  Mask: 'mask',
};

function Controls({ config, setConfig, onImageUpload }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleConfigChange = (key, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [key]: value
    }));
  };

  const handleScalingAxisChange = axis => {
    setConfig(prevConfig => ({
      ...prevConfig,
      scalingAxis: axis,
    }));
  };

  const handleGeneratorChange = generator => {
    setConfig(prevConfig => ({
      ...prevConfig,
      generator,
    }));
  };

  const handleDisplayModeChange = displayMode => {
    setConfig(prevConfig => ({
      ...prevConfig,
      displayMode,
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
              Generator
              <HelpTooltip>
                {`Fast: Picks the best from randomly generated seams.

                Predictive: Uses an energy map to pick the best seams.  Slightly slower than Fast.
                
                Full: Precise seam calculation.  Much slower.
                
                Cached: Uses pre-computed seams for the best speed and quality, but requires an extra download and server side processing.`}
              </HelpTooltip>
            </label>
            <ButtonGroup
              options={Generator}
              selectedValue={config.generator}
              onSelect={handleGeneratorChange}
              disabledOptions={[Generator.Cached, Generator.Full]}
            />
          </div>
          <div className="control-group">
            <label>
              Scaling Axis
              <HelpTooltip>{`Determines the axis for scaling.
              
              Horizontal: Scales the image horizontally.
              
              Vertical: Scales the image vertically.
              
              Auto: Scales horizontally when shrinking the x-axis, and vertically when shrinking the y-axis.
              
              Dual: Scales both horizontally and vertically.  This option is only available with the fast and predictive generators.  It should also not be used when images are fluidly rescaled, only when they have fixed sizes`}</HelpTooltip>
            </label>
            <ButtonGroup
              options={ScalingAxis}
              selectedValue={config.scalingAxis}
              onSelect={handleScalingAxisChange}
            />
          </div>
          <div className="control-group">
            <label>
              Display Mode
              <HelpTooltip>{`Image: Shows the normal image.
                
                Energy: Displays a grayscale 'energy map' where
                darker areas have lower energy and are more likely to be carved out by seams.
                
                Grayscale: Shows the image in grayscale.`}
              </HelpTooltip>
            </label>
            <ButtonGroup
              options={DisplayMode}
              selectedValue={config.displayMode}
              onSelect={handleDisplayModeChange}
            />
          </div>
          <div className="control-group">
            <label>
              Carving priority: {Math.round(config.carvingPriority * 100)}%
              <HelpTooltip>
                {`Use seam carving for this percentage of scaling.  Use normal image scaling for the rest.

                e.g. if set to 50% and the image is scaled from 1000px to 900px, seam carving will scale the image to 950px, and then normal image scaling will scale the image to 900px.`}
              </HelpTooltip>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.carvingPriority * 100}
              onChange={e => handleConfigChange('carvingPriority', e.target.value / 100)}
            />
          </div>
          <div className="control-group">
            <label>
              Max down scaling: {Math.round(config.maxCarveDownScale * 100)}%
              <HelpTooltip>
                Remove up to this percentage of seams when downscaling.
                Beyond this, normal image scaling is used.  This prevents seam carving from carving up
                important structural elements, opting to squish them instead.
              </HelpTooltip>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.maxCarveDownScale * 100}
              onChange={e => handleConfigChange('maxCarveDownScale', e.target.value / 100)}
            />
          </div>
          <div className="control-group">
            <label>
              Max up scaling: {config.maxCarveUpScale}x
              <HelpTooltip>
                Only use seam carving to enlarge up to this percentage past the original width.
                Beyond this, normal image scaling is used.
              </HelpTooltip>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={config.maxCarveUpScale}
              onChange={e => handleConfigChange('maxCarveUpScale', e.target.value)}
            />
          </div>
          <div className="control-group">
            <label>
              % of seams to use for enlarging:{' '}
              {Math.round(config.maxCarveUpSeamPercentage * 100)}%
              <HelpTooltip>
                Only interpolate this % of seams when up-scaling, which prevents seam carving imporant structural elements.  If set to 100%, the effective result is normal image scaling above 2x as every single pixel will be interpolated.
              </HelpTooltip>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.maxCarveUpSeamPercentage * 100}
              onChange={e =>
                handleConfigChange('maxCarveUpSeamPercentage', e.target.value / 100)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Controls; 