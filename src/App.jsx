import '../../build/img-responsive-web-component.js';
import React, { useState } from 'react';
import ImageSelector from './components/ImageSelector.jsx';
import Controls from './components/Controls.jsx';

function App() {
  const [selectedImage, setSelectedImage] = useState('Broadway_tower.jpg');
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [config, setConfig] = useState({
    showSeams: false,
    showEnergyMap: false,
    maxCarveUpSeamPercentage: 0.6,
    maxCarveUpScale: 3,
    maxCarveDownScale: 0.5,
    generator: 'random',
  });

  const handleImageSelect = (imageName) => {
    setSelectedImage(imageName);
    setUploadedImageSrc(null);
  };

  const handleImageUpload = (imageSrc) => {
    setUploadedImageSrc(imageSrc);
    setSelectedImage(null);
  };

  const imageToDisplay = uploadedImageSrc || (selectedImage ? `images/${selectedImage}` : '');

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
          <div className="seam-container-resizable">
            {imageToDisplay && (
              <img-responsive
                src={imageToDisplay}
                showSeams={config.showSeams}
                showEnergyMap={config.showEnergyMap}
                maxCarveUpSeamPercentage={config.maxCarveUpSeamPercentage}
                maxCarveUpScale={config.maxCarveUpScale}
                maxCarveDownScale={config.maxCarveDownScale}
                generator={config.generator}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 