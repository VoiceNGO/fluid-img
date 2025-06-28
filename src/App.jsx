import '../../dist/fluid-img.js';
import React, { useState, useEffect, useRef } from 'react';
import ImageSelector from './components/ImageSelector.jsx';
import Controls from './components/controls/controls.jsx';
import ResizableContainer from './components/ResizableContainer.jsx';
import LogWindow from './components/log-window/log-window.jsx';
import CodePreview from './components/code-preview/code-preview.jsx';
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
    useMask: true,
    batchPercentage: 0.1,
    minBatchSize: 10,
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
  const [uploadedImageName, setUploadedImageName] = useState(null);
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
    setUploadedImageName(null);
    setMaskSrc(maskFile);
  };

  const handleImageUpload = ({ src, name }) => {
    setLogs([]);
    setUploadedImageSrc(src);
    setUploadedImageName(name);
    setSelectedImage(null);
    setMaskSrc(null);
  };

  const handleReset = () => {
    setConfig(defaultState.config);
  };

  return (
    <div className="App">
      <main className="App-main">
        <div className="left-panel">
          <ImageSelector onSelect={handleImageSelect} />
          <Controls
            config={config}
            setConfig={setConfig}
            onImageUpload={handleImageUpload}
            hasMask={!!maskSrc}
            onReset={handleReset}
          />
        </div>
        <div className="main-content">
          <LogWindow logs={logs} />
          <ResizableContainer>
            {imageToDisplay && (
              <fluid-img
                ref={imgResponsiveRef}
                src={imageToDisplay}
                mask={config.useMask ? maskSrc : null}
                generator={config.generator}
                show-seams={config.showSeams}
                carving-priority={config.carvingPriority}
                max-carve-up-seam-percentage={config.maxCarveUpSeamPercentage}
                max-carve-up-scale={config.maxCarveUpScale}
                max-carve-down-scale={config.maxCarveDownScale}
                scaling-axis={config.scalingAxis}
                batch-percentage={config.batchPercentage}
                min-batch-size={config.minBatchSize}
                {...(config.displayMode === 'energy' ? { 'show-energy-map': '' } : {})}
                {...(config.displayMode === 'grayscale' ? { grayscale: '' } : {})}
              />
            )}
          </ResizableContainer>
          <CodePreview
            config={config}
            imageSrc={uploadedImageName || imageToDisplay}
            maskSrc={config.useMask ? maskSrc : null}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
