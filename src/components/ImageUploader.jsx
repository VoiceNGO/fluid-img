import React from 'react';

function ImageUploader({ onImageUpload }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImageUpload(URL.createObjectURL(file));
    }
  };

  return (
    <div className="image-uploader">
      <label htmlFor="file-upload">Upload an Image:</label>
      <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}

export default ImageUploader; 