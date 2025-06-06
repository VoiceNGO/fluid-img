import React, { useState } from 'react';
import ImageSelector from './components/ImageSelector.jsx';
import ImageUploader from './components/ImageUploader.jsx';
import Seam from './components/Seam.jsx';

function App() {
  const [selectedImage, setSelectedImage] = useState('Broadway_tower.jpg');
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [showSeams, setShowSeams] = useState(false);
  const [scaleDown, setScaleDown] = useState(50);
  const [scaleUp, setScaleUp] = useState(50);

  const handleImageSelect = (imageName) => {
    setSelectedImage(imageName);
    setUploadedImageSrc(null); // Clear uploaded image when a preset is chosen
  };

  const handleImageUpload = (imageSrc) => {
    setUploadedImageSrc(imageSrc);
    setSelectedImage(null); // Clear preset image when one is uploaded
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
          <div className="controls-panel">
            <div className="control-group">
              <ImageUploader onImageUpload={handleImageUpload} />
            </div>
            <div className="control-group">
              <label>Max scale down: {scaleDown}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={scaleDown}
                onChange={(e) => setScaleDown(e.target.value)}
              />
            </div>
            <div className="control-group">
              <label>Max scale up: {scaleUp}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={scaleUp}
                onChange={(e) => setScaleUp(e.target.value)}
              />
            </div>
            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={showSeams}
                  onChange={e => setShowSeams(e.target.checked)}
                />
                Show Seams
              </label>
            </div>
          </div>
        </div>
        <div className="main-content">
          <div className="seam-container-resizable">
            {imageToDisplay && (
              <Seam
                src={imageToDisplay}
                showSeams={showSeams}
                scaleDown={scaleDown}
                scaleUp={scaleUp}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 