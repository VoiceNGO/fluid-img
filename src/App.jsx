import '../../build/responsive-img.js';
import '../../build/responsive-img-predictive.js';
import '../../build/responsive-img-full.js';
import '../../build/responsive-img-cached.js';
import React, { useState, useEffect, useRef } from 'react';
import ImageSelector from './components/ImageSelector.jsx';
import Controls from './components/Controls.jsx';
import ResizableContainer from './components/ResizableContainer.jsx';
import LogWindow from './components/LogWindow.jsx';
import { ScalingAxis } from '../../src/utils/enums/enums';
import useLocalStorage from './hooks/useLocalStorage.js';

const defaultState = {
  selectedImage: 'Broadway_tower.jpg',
  maskSrc: null,
  config: {
    displayMode: '',
    showSeams: false,
    showEnergyMap: false,
    carvingPriority: 1,
    maxCarveUpSeamPercentage: 0.6,
    maxCarveUpScale: 3,
    maxCarveDownScale: 0.7,
    generator: 'predictive',
    scalingAxis: ScalingAxis.Horizontal,
  },
};

function App() {
  const [selectedImage, setSelectedImage] = useLocalStorage(
    'selectedImage',
    defaultState.selectedImage
  );
  const [maskSrc, setMaskSrc] = useLocalStorage('maskSrc', defaultState.maskSrc);
  const [config, setConfig] = useLocalStorage('config', defaultState.config);

  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [logs, setLogs] = useState([]);
  const imgResponsiveRef = useRef(null);

  const log = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const imageToDisplay = uploadedImageSrc || (selectedImage ? `images/${selectedImage}` : '');

  useEffect(() => {
    const currentRef = imgResponsiveRef.current;
    const handleLog = (event) => {
      log(event.detail.message);
    };

    if (currentRef) {
      currentRef.addEventListener('log', handleLog);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('log', handleLog);
      }
    };
  }, [imageToDisplay, config.generator]);

  const handleImageSelect = (imageName, maskFile) => {
    setLogs([]);
    setSelectedImage(imageName);
    setUploadedImageSrc(null);
    setMaskSrc(maskFile);
  };

  const handleImageUpload = (imageSrc) => {
    setLogs([]);
    setUploadedImageSrc(imageSrc);
    setSelectedImage(null);
    setMaskSrc(null);
  };

  // Get the appropriate component tag name
  const getComponentTagName = () => {
    switch (config.generator) {
      case 'predictive':
        return 'responsive-img-predictive';
      case 'full':
        return 'responsive-img-full';
      case 'cached':
        return 'responsive-img-cached';
      case 'random':
      default:
        return 'responsive-img';
    }
  };

  const ComponentTag = getComponentTagName();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Live Seam Carving Demo</h1>
      </header>
      <main className="App-main">
        <div className="left-panel">
          <ImageSelector onSelect={handleImageSelect} />
          <Controls
            config={config}
            setConfig={setConfig}
            onImageUpload={handleImageUpload}
          />
        </div>
        <div className="main-content">
          <LogWindow logs={logs} />
          <ResizableContainer>
            {imageToDisplay && (
              <ComponentTag
                ref={imgResponsiveRef}
                src={imageToDisplay}
                mask={maskSrc}
                show-seams={config.showSeams}
                {...(config.displayMode === 'energy' ? { 'show-energy-map': '' } : {})}
                carving-priority={config.carvingPriority}
                max-carve-up-seam-percentage={config.maxCarveUpSeamPercentage}
                max-carve-up-scale={config.maxCarveUpScale}
                max-carve-down-scale={config.maxCarveDownScale}
                scaling-axis={config.scalingAxis}
              />
            )}
          </ResizableContainer>
        </div>
      </main>
    </div>
  );
}

export default App; 