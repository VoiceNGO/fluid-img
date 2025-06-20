import '../../build/img-responsive-web-component.js';
import React, { useState, useEffect, useRef } from 'react';
import ImageSelector from './components/ImageSelector.jsx';
import Controls from './components/Controls.jsx';
import ResizableContainer from './components/ResizableContainer.jsx';
import LogWindow from './components/LogWindow.jsx';

function App() {
  const [selectedImage, setSelectedImage] = useState('Broadway_tower.jpg');
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [logs, setLogs] = useState([]);
  const [config, setConfig] = useState({
    showSeams: false,
    showEnergyMap: false,
    maxCarveUpSeamPercentage: 0.6,
    maxCarveUpScale: 3,
    maxCarveDownScale: 1,
    generator: 'random',
  });
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
  }, [imageToDisplay]);

  const handleImageSelect = (imageName) => {
    setLogs([]);
    setSelectedImage(imageName);
    setUploadedImageSrc(null);
  };

  const handleImageUpload = (imageSrc) => {
    setLogs([]);
    setUploadedImageSrc(imageSrc);
    setSelectedImage(null);
  };

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
              <img-responsive
                ref={imgResponsiveRef}
                src={imageToDisplay}
                show-seams={config.showSeams}
                show-energy-map={config.showEnergyMap}
                max-carve-up-seam-percentage={config.maxCarveUpSeamPercentage}
                max-carve-up-scale={config.maxCarveUpScale}
                max-carve-down-scale={config.maxCarveDownScale}
                generator={config.generator}
              />
            )}
          </ResizableContainer>
        </div>
      </main>
    </div>
  );
}

export default App; 