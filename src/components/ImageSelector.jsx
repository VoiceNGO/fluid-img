import React from 'react';

const images = [
  ['Broadway_tower.jpg', false],
  ['dogs-on-beach.jpg', true],
  ['kiyomizu.jpg', false],
  ['neuschwanstein.jpg', true],
  ['yosemite.jpg', true],
  ['great-wave.jpg', false],
  ['railay.jpg', false],
];

function ImageSelector({ onSelect }) {
  const handleClick = (image, hasMask) => {
    const maskSrc = hasMask
      ? `images/${image.replace(/\.jpg$/, '-mask.png')}`
      : null;
    onSelect(image, maskSrc);
  };

  return (
    <div className="image-selector">
      <div className="thumbnails">
        {images.map(([image, hasMask]) => (
          <img
            key={image}
            src={`images/${image.replace('.jpg', '_thumb.jpg')}`}
            alt={`thumbnail ${image}`}
            className="thumbnail"
            onClick={() => handleClick(image, hasMask)}
          />
        ))}
      </div>
    </div>
  );
}

export default ImageSelector; 