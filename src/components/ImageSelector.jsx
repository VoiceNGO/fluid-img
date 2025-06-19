import React from 'react';

const images = [
  'Broadway_tower.jpg',
  'dogs-on-beach.jpg',
  'kiyomizu.jpg',
  'neuschwanstein.jpg',
  'yosemite.jpg',
  'great-wave.jpg',
  'railay.jpg',
];

function ImageSelector({ onSelect }) {
  return (
    <div className="image-selector">
      <div className="thumbnails">
        {images.map(image => (
          <img
            key={image}
            src={`images/${image.replace('.jpg', '_thumb.jpg')}`}
            alt={`thumbnail ${image}`}
            className="thumbnail"
            onClick={() => onSelect(image)}
          />
        ))}
      </div>
    </div>
  );
}

export default ImageSelector; 