import React from 'react';

function ImageUploader({ onImageUpload }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImageUpload({
        src: URL.createObjectURL(file),
        name: file.name,
      });
    }
  };

  return (
    <div className="image-uploader">
      <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}

export default ImageUploader;
