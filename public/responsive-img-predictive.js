"use strict";
(() => {
  // src/utils/image-loader/image-loader.ts
  var EvenWidthImage = class extends Image {
    #rotate;
    constructor(options = {}) {
      super();
      this.crossOrigin = `Anonymous`;
      this.#rotate = !!options.rotate;
    }
    get width() {
      const originalWidth = this.#rotate ? super.height : super.width;
      return originalWidth - originalWidth % 2;
    }
    get height() {
      return this.#rotate ? super.width : super.height;
    }
  };
  var ImageLoader = class {
    #src;
    #imgPromise;
    #imageDataPromise;
    #rotate;
    #profiler;
    constructor(src, options) {
      this.#src = src;
      this.#rotate = options.rotate;
      this.#profiler = options.profiler;
      this.#imgPromise = this.#loadImage();
      this.#imageDataPromise = this.#imgPromise.then((img) => this.#loadImageData(img));
    }
    #loadImage() {
      return new Promise((resolve, reject) => {
        const src = this.#src;
        const img = new EvenWidthImage({ rotate: this.#rotate });
        img.onload = () => resolve(img);
        img.onerror = () => reject(`Failed to load image: ${src}`);
        img.onabort = () => reject(`Image loading aborted: ${src}`);
        img.src = src;
      });
    }
    #loadImageData(image) {
      const profiler = this.#profiler;
      return new Promise((resolve) => {
        profiler.start("loadImageData");
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext("2d");
        if (this.#rotate) {
          context.translate(image.width, 0);
          context.rotate(Math.PI / 2);
        }
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, image.width, image.height);
        profiler.end("loadImageData");
        resolve(imageData);
      });
    }
    get src() {
      return this.#src;
    }
    get image() {
      return this.#imgPromise;
    }
    get imageData() {
      return this.#imageDataPromise;
    }
  };

  // src/utils/deterministic-binary-rnd/deterministic-binary-rnd.ts
  var deterministicBinaryRnd = (seed1) => (seed2) => {
    let h = seed1 ^ seed2;
    h ^= h >>> 16;
    h *= 2246822507;
    h ^= h >>> 13;
    h *= 3266489909;
    h ^= h >>> 16;
    return h & 1;
  };

  // src/utils/delete-array-indicies/delete-array-indicies.ts
  function deleteArrayIndices(array, uniqueSortedIndicesToRemove, elementsPerRemoval = 1) {
    const newSize = array.length - uniqueSortedIndicesToRemove.length * elementsPerRemoval;
    const ArrayConstructor = array.constructor;
    const result = new ArrayConstructor(newSize);
    let resultOffset = 0;
    let sourceStart = 0;
    let lastIndex = -1;
    for (const deleteIndex of uniqueSortedIndicesToRemove) {
      if (lastIndex === deleteIndex) {
        throw new Error("[deleteArrayIndices]: Duplicate index detected");
      }
      if (lastIndex > deleteIndex) {
        throw new Error("[deleteArrayIndices]: Indices are not sorted");
      }
      const chunkSize = deleteIndex - sourceStart;
      if (chunkSize > 0) {
        result.set(array.subarray(sourceStart, deleteIndex), resultOffset);
        resultOffset += chunkSize;
      }
      sourceStart = deleteIndex + elementsPerRemoval;
      lastIndex = deleteIndex;
    }
    if (sourceStart < array.length) {
      result.set(array.subarray(sourceStart), resultOffset);
    }
    return result;
  }

  // src/generator/grayscale/grayscale.ts
  function getGrayscaleImageData(imageData, asRows, useLinearApproximation = false) {
    const { data, width, height } = imageData;
    const grayscaleData = asRows ? new Array(height) : new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      const rowOffset = y * width;
      const currentArray = asRows ? grayscaleData[y] = new Uint8Array(width) : grayscaleData;
      for (let x = 0; x < width; x++) {
        const ix = (rowOffset + x) * 4;
        const r = data[ix];
        const g = data[ix + 1];
        const b = data[ix + 2];
        const a = data[ix + 3];
        let gray;
        if (useLinearApproximation) {
          gray = (r + g + b) / 3 * a / 255;
        } else {
          gray = (0.299 * r + 0.587 * g + 0.114 * b) * a / 255;
        }
        currentArray[asRows ? x : rowOffset + x] = gray;
      }
    }
    return grayscaleData;
  }

  // src/generator/sobel-energy-map/sobel-energy-map.ts
  var SobelEnergyMap = class {
    #data;
    #width;
    #height;
    #grayscaleMap;
    #originalIndices;
    #maskData;
    constructor(imageData, maskData) {
      this.#width = imageData.width;
      this.#height = imageData.height;
      this.#data = new Array(this.#height);
      this.#originalIndices = new Array(this.#height);
      this.#maskData = maskData;
      this.#grayscaleMap = getGrayscaleImageData(imageData, true);
      this.#fillOriginalIndices();
      this.#data = this.#computeFullEnergyMap();
    }
    #getMaskEnergy(y, x) {
      if (!this.#maskData) {
        return 255;
      }
      const originalIndex = this.#originalIndices[y][x];
      return this.#maskData[originalIndex];
    }
    #fillOriginalIndices() {
      for (let y = 0; y < this.#height; y++) {
        this.#originalIndices[y] = new Uint32Array(this.#width);
        for (let x = 0; x < this.#width; x++) {
          this.#originalIndices[y][x] = y * this.#width + x;
        }
      }
    }
    #computeFullEnergyMap(width = this.#width, height = this.#height) {
      const energyMapData = new Array(height);
      for (let y = 0; y < height; y++) {
        energyMapData[y] = new Uint16Array(width);
        const y1 = Math.max(0, y - 1);
        const y3 = Math.min(height - 1, y + 1);
        const prevRow = this.#grayscaleMap[y1];
        const currentRow = this.#grayscaleMap[y];
        const nextRow = this.#grayscaleMap[y3];
        for (let x = 0; x < width; x++) {
          const x1 = Math.max(0, x - 1);
          const x3 = Math.min(width - 1, x + 1);
          const gx = -prevRow[x1] + prevRow[x3] + -currentRow[x1] * 2 + currentRow[x3] * 2 + -nextRow[x1] + nextRow[x3];
          const gy = -prevRow[x1] + -prevRow[x] * 2 + -prevRow[x3] + nextRow[x1] + nextRow[x] * 2 + nextRow[x3];
          const sobelEnergy = (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
          const maskEnergy = this.#getMaskEnergy(y, x);
          energyMapData[y][x] = sobelEnergy * (maskEnergy / 255);
        }
      }
      return energyMapData;
    }
    get width() {
      return this.#width;
    }
    get height() {
      return this.#height;
    }
    get energyMap() {
      return this.#data;
    }
    get originalIndices() {
      return this.#originalIndices;
    }
    removeSeam(xIndices) {
      for (let y = 0; y < this.#height; y++) {
        const xToRemove = xIndices[y];
        this.#data[y] = deleteArrayIndices(this.#data[y], [xToRemove]);
        this.#originalIndices[y] = deleteArrayIndices(this.#originalIndices[y], [xToRemove]);
      }
      this.#width--;
      const g = (colInNewCoord, removedOriginalIndex) => colInNewCoord < removedOriginalIndex ? colInNewCoord : colInNewCoord + 1;
      for (let y = 0; y < this.#height; y++) {
        const removedColOrigIdx = xIndices[y];
        const y1 = Math.max(0, y - 1);
        const y3 = Math.min(this.#height - 1, y + 1);
        const prevRow = this.#grayscaleMap[y1];
        const currentRow = this.#grayscaleMap[y];
        const nextRow = this.#grayscaleMap[y3];
        const columnsInNewDataToUpdate = [];
        if (removedColOrigIdx > 0) {
          columnsInNewDataToUpdate.push(removedColOrigIdx - 1);
        }
        if (removedColOrigIdx < this.#width) {
          columnsInNewDataToUpdate.push(removedColOrigIdx);
        }
        for (const xCurrent of columnsInNewDataToUpdate) {
          const x1 = Math.max(0, g(xCurrent - 1, removedColOrigIdx));
          const x3 = Math.min(this.#grayscaleMap[0].length - 1, g(xCurrent + 1, removedColOrigIdx));
          const xCenter = g(xCurrent, removedColOrigIdx);
          const gx = -prevRow[x1] + prevRow[x3] + -currentRow[x1] * 2 + currentRow[x3] * 2 + -nextRow[x1] + nextRow[x3];
          const gy = -prevRow[x1] + -prevRow[xCenter] * 2 + -prevRow[x3] + nextRow[x1] + nextRow[xCenter] * 2 + nextRow[x3];
          const sobelEnergy = (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
          const maskEnergy = this.#getMaskEnergy(y, xCurrent);
          this.#data[y][xCurrent] = sobelEnergy + maskEnergy;
        }
      }
    }
    removeSeams(seams) {
      if (seams.length === 0) {
        return;
      }
      const numSeamsToRemove = seams.length;
      for (let y = 0; y < this.#height; y++) {
        const indicesToRemoveForRow = seams.map((seamPath) => seamPath[y]).sort((a, b) => a - b);
        this.#data[y] = deleteArrayIndices(this.#data[y], indicesToRemoveForRow);
        this.#grayscaleMap[y] = deleteArrayIndices(this.#grayscaleMap[y], indicesToRemoveForRow);
        this.#originalIndices[y] = deleteArrayIndices(
          this.#originalIndices[y],
          indicesToRemoveForRow
        );
      }
      this.#width -= numSeamsToRemove;
      this.#data = this.#computeFullEnergyMap();
    }
    getEnergyMapAsImageData(width = this.#width, height = this.#height) {
      const energyMapData = this.#computeFullEnergyMap(width, height);
      let minEnergy = Infinity;
      let maxEnergy = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const energy = energyMapData[y][x];
          if (energy < minEnergy) minEnergy = energy;
          if (energy > maxEnergy) maxEnergy = energy;
        }
      }
      const energyRange = maxEnergy - minEnergy;
      const imageData = new ImageData(width, height);
      const data = imageData.data;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const energy = energyMapData[y][x];
          const normalizedEnergy = energyRange > 0 ? Math.round((energy - minEnergy) / energyRange * 255) : 0;
          data[index] = normalizedEnergy;
          data[index + 1] = normalizedEnergy;
          data[index + 2] = normalizedEnergy;
          data[index + 3] = 255;
        }
      }
      return imageData;
    }
  };

  // src/generator/dual-energy-map/dual-energy-map.ts
  function getPixelIndex(x, y, width) {
    return (y * width + x) * 4;
  }
  function getGrayscale(x, y, width, data) {
    if (x < 0 || x >= width || y < 0 || y >= Math.floor(data.length / (width * 4))) {
      return 0;
    }
    const i = getPixelIndex(x, y, width);
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] * data[i + 3] / 255;
  }
  function getColorDistance(x1, y1, x2, y2, width, data) {
    if (x1 < 0 || x1 >= width || y1 < 0 || y1 >= Math.floor(data.length / (width * 4)) || x2 < 0 || x2 >= width || y2 < 0 || y2 >= Math.floor(data.length / (width * 4))) {
      return 0;
    }
    const i1 = getPixelIndex(x1, y1, width);
    const i2 = getPixelIndex(x2, y2, width);
    const dr = data[i1] - data[i2];
    const dg = data[i1 + 1] - data[i2 + 1];
    const db = data[i1 + 2] - data[i2 + 2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }
  var DualEnergyMap = class {
    #data;
    #width;
    #height;
    #grayscaleMap;
    #originalIndices;
    #imageData;
    #forwardEnergyWeight;
    constructor(imageData, forwardEnergyWeight = 1, maskData) {
      this.#width = imageData.width;
      this.#height = imageData.height;
      this.#imageData = imageData;
      this.#forwardEnergyWeight = forwardEnergyWeight;
      this.#data = new Array(this.#height);
      this.#grayscaleMap = new Array(this.#height);
      this.#originalIndices = new Array(this.#height);
      this.#fillOriginalIndices();
      this.#computeGrayscaleMap(imageData);
      this.#data = this.#computeFullEnergyMap();
    }
    #fillOriginalIndices() {
      for (let y = 0; y < this.#height; y++) {
        this.#originalIndices[y] = new Uint32Array(this.#width);
        for (let x = 0; x < this.#width; x++) {
          this.#originalIndices[y][x] = y * this.#width + x;
        }
      }
    }
    #computeGrayscaleMap(imageData) {
      for (let y = 0; y < this.#height; y++) {
        this.#grayscaleMap[y] = new Uint8Array(this.#width);
        for (let x = 0; x < this.#width; x++) {
          this.#grayscaleMap[y][x] = getGrayscale(x, y, this.#width, imageData.data);
        }
      }
    }
    #computeBackwardEnergy(x, y) {
      const y1 = Math.max(0, y - 1);
      const y3 = Math.min(this.#height - 1, y + 1);
      const x1 = Math.max(0, x - 1);
      const x3 = Math.min(this.#width - 1, x + 1);
      const prevRow = this.#grayscaleMap[y1];
      const currentRow = this.#grayscaleMap[y];
      const nextRow = this.#grayscaleMap[y3];
      const gx = -prevRow[x1] + prevRow[x3] + -currentRow[x1] * 2 + currentRow[x3] * 2 + -nextRow[x1] + nextRow[x3];
      const gy = -prevRow[x1] + -prevRow[x] * 2 + -prevRow[x3] + nextRow[x1] + nextRow[x] * 2 + nextRow[x3];
      return (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
    }
    #computeForwardEnergy(x, y) {
      const data = this.#imageData.data;
      const leftX = x - 1;
      const rightX = x + 1;
      const horizontalCost = getColorDistance(leftX, y, rightX, y, this.#width, data);
      const topY = y - 1;
      const bottomY = y + 1;
      const verticalCost = getColorDistance(x, topY, x, bottomY, this.#width, data);
      let diagonalCost = 0;
      if (leftX >= 0 && topY >= 0) {
        diagonalCost += getColorDistance(leftX, topY, rightX, y, this.#width, data);
      }
      if (rightX < this.#width && bottomY < this.#height) {
        diagonalCost += getColorDistance(rightX, bottomY, leftX, y, this.#width, data);
      }
      return horizontalCost + verticalCost + diagonalCost * 0.5;
    }
    #computeFullEnergyMap(width = this.#width, height = this.#height) {
      const energyMapData = new Array(height);
      for (let y = 0; y < height; y++) {
        energyMapData[y] = new Uint16Array(width);
        for (let x = 0; x < width; x++) {
          const backwardEnergy = this.#computeBackwardEnergy(x, y);
          const forwardEnergy = this.#computeForwardEnergy(x, y);
          const totalEnergy = backwardEnergy + this.#forwardEnergyWeight * forwardEnergy;
          energyMapData[y][x] = Math.min(65535, Math.max(0, Math.round(totalEnergy)));
        }
      }
      return energyMapData;
    }
    get width() {
      return this.#width;
    }
    get height() {
      return this.#height;
    }
    get energyMap() {
      return this.#data;
    }
    get originalIndices() {
      return this.#originalIndices;
    }
    removeSeam(xIndices) {
      for (let y = 0; y < this.#height; y++) {
        const xToRemove = xIndices[y];
        this.#data[y] = deleteArrayIndices(this.#data[y], [xToRemove]);
        this.#originalIndices[y] = deleteArrayIndices(this.#originalIndices[y], [xToRemove]);
      }
      this.#width--;
      const newImageData = new ImageData(this.#width, this.#height);
      let writeIndex = 0;
      for (let y = 0; y < this.#height; y++) {
        const seamX = xIndices[y];
        for (let x = 0; x < this.#width + 1; x++) {
          if (x !== seamX) {
            const readIndex = (y * (this.#width + 1) + x) * 4;
            newImageData.data[writeIndex] = this.#imageData.data[readIndex];
            newImageData.data[writeIndex + 1] = this.#imageData.data[readIndex + 1];
            newImageData.data[writeIndex + 2] = this.#imageData.data[readIndex + 2];
            newImageData.data[writeIndex + 3] = this.#imageData.data[readIndex + 3];
            writeIndex += 4;
          }
        }
      }
      this.#imageData = newImageData;
      const g = (colInNewCoord, removedOriginalIndex) => colInNewCoord < removedOriginalIndex ? colInNewCoord : colInNewCoord + 1;
      for (let y = 0; y < this.#height; y++) {
        const removedColOrigIdx = xIndices[y];
        const columnsInNewDataToUpdate = [];
        if (removedColOrigIdx > 0) {
          columnsInNewDataToUpdate.push(removedColOrigIdx - 1);
        }
        if (removedColOrigIdx < this.#width) {
          columnsInNewDataToUpdate.push(removedColOrigIdx);
        }
        for (const xCurrent of columnsInNewDataToUpdate) {
          const backwardEnergy = this.#computeBackwardEnergy(xCurrent, y);
          const forwardEnergy = this.#computeForwardEnergy(xCurrent, y);
          const totalEnergy = backwardEnergy + this.#forwardEnergyWeight * forwardEnergy;
          this.#data[y][xCurrent] = Math.min(65535, Math.max(0, Math.round(totalEnergy)));
        }
      }
    }
    removeSeams(seams) {
      if (seams.length === 0) {
        return;
      }
      const numSeamsToRemove = seams.length;
      for (let y = 0; y < this.#height; y++) {
        const indicesToRemoveForRow = seams.map((seamPath) => seamPath[y]).sort((a, b) => a - b);
        this.#data[y] = deleteArrayIndices(this.#data[y], indicesToRemoveForRow);
        this.#grayscaleMap[y] = deleteArrayIndices(this.#grayscaleMap[y], indicesToRemoveForRow);
        this.#originalIndices[y] = deleteArrayIndices(
          this.#originalIndices[y],
          indicesToRemoveForRow
        );
      }
      this.#width -= numSeamsToRemove;
      const newImageData = new ImageData(this.#width, this.#height);
      let writeIndex = 0;
      for (let y = 0; y < this.#height; y++) {
        const indicesToRemove = seams.map((seamPath) => seamPath[y]).sort((a, b) => a - b);
        let removeIndex = 0;
        for (let x = 0; x < this.#width + numSeamsToRemove; x++) {
          if (removeIndex < indicesToRemove.length && x === indicesToRemove[removeIndex]) {
            removeIndex++;
            continue;
          }
          const readIndex = (y * (this.#width + numSeamsToRemove) + x) * 4;
          newImageData.data[writeIndex] = this.#imageData.data[readIndex];
          newImageData.data[writeIndex + 1] = this.#imageData.data[readIndex + 1];
          newImageData.data[writeIndex + 2] = this.#imageData.data[readIndex + 2];
          newImageData.data[writeIndex + 3] = this.#imageData.data[readIndex + 3];
          writeIndex += 4;
        }
      }
      this.#imageData = newImageData;
      this.#data = this.#computeFullEnergyMap();
    }
    getEnergyMapAsImageData(width = this.#width, height = this.#height) {
      const energyMapData = this.#computeFullEnergyMap(width, height);
      let minEnergy = Infinity;
      let maxEnergy = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const energy = energyMapData[y][x];
          if (energy < minEnergy) minEnergy = energy;
          if (energy > maxEnergy) maxEnergy = energy;
        }
      }
      const energyRange = maxEnergy - minEnergy;
      const imageData = new ImageData(width, height);
      const data = imageData.data;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const energy = energyMapData[y][x];
          const normalizedEnergy = energyRange > 0 ? Math.round((energy - minEnergy) / energyRange * 255) : 0;
          data[index] = normalizedEnergy;
          data[index + 1] = normalizedEnergy;
          data[index + 2] = normalizedEnergy;
          data[index + 3] = 255;
        }
      }
      return imageData;
    }
  };

  // src/generator/boundary-aware-energy-map/boundary-aware-energy-map.ts
  function getPixelIndex2(x, y, width) {
    return (y * width + x) * 4;
  }
  function getGrayscale2(x, y, width, data) {
    if (x < 0 || x >= width || y < 0 || y >= Math.floor(data.length / (width * 4))) {
      return 0;
    }
    const i = getPixelIndex2(x, y, width);
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] * data[i + 3] / 255;
  }
  function getColorDistance2(x1, y1, x2, y2, width, data) {
    if (x1 < 0 || x1 >= width || y1 < 0 || y1 >= Math.floor(data.length / (width * 4)) || x2 < 0 || x2 >= width || y2 < 0 || y2 >= Math.floor(data.length / (width * 4))) {
      return 0;
    }
    const i1 = getPixelIndex2(x1, y1, width);
    const i2 = getPixelIndex2(x2, y2, width);
    const dr = data[i1] - data[i2];
    const dg = data[i1 + 1] - data[i2 + 1];
    const db = data[i1 + 2] - data[i2 + 2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }
  function getRegionVariance(centerX, centerY, radius, width, data) {
    let sum = 0;
    let sumSquares = 0;
    let count = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < width && y >= 0 && y < Math.floor(data.length / (width * 4))) {
          const gray = getGrayscale2(x, y, width, data);
          sum += gray;
          sumSquares += gray * gray;
          count++;
        }
      }
    }
    if (count < 2) return 0;
    const mean = sum / count;
    const variance = sumSquares / count - mean * mean;
    return Math.sqrt(variance);
  }
  var BoundaryAwareEnergyMap = class {
    #data;
    #width;
    #height;
    #grayscaleMap;
    #originalIndices;
    #imageData;
    #boundaryPenaltyWeight;
    #uniformityThreshold;
    #edgeThreshold;
    constructor(imageData, boundaryPenaltyWeight = 5, uniformityThreshold = 10, edgeThreshold = 20, maskData) {
      this.#width = imageData.width;
      this.#height = imageData.height;
      this.#imageData = imageData;
      this.#boundaryPenaltyWeight = boundaryPenaltyWeight;
      this.#uniformityThreshold = uniformityThreshold;
      this.#edgeThreshold = edgeThreshold;
      this.#data = new Array(this.#height);
      this.#grayscaleMap = new Array(this.#height);
      this.#originalIndices = new Array(this.#height);
      this.#fillOriginalIndices();
      this.#computeGrayscaleMap(imageData);
      this.#data = this.#computeFullEnergyMap();
    }
    #fillOriginalIndices() {
      for (let y = 0; y < this.#height; y++) {
        this.#originalIndices[y] = new Uint32Array(this.#width);
        for (let x = 0; x < this.#width; x++) {
          this.#originalIndices[y][x] = y * this.#width + x;
        }
      }
    }
    #computeGrayscaleMap(imageData) {
      for (let y = 0; y < this.#height; y++) {
        this.#grayscaleMap[y] = new Uint8Array(this.#width);
        for (let x = 0; x < this.#width; x++) {
          this.#grayscaleMap[y][x] = getGrayscale2(x, y, this.#width, imageData.data);
        }
      }
    }
    #computeGradientEnergy(x, y) {
      const y1 = Math.max(0, y - 1);
      const y3 = Math.min(this.#height - 1, y + 1);
      const x1 = Math.max(0, x - 1);
      const x3 = Math.min(this.#width - 1, x + 1);
      const prevRow = this.#grayscaleMap[y1];
      const currentRow = this.#grayscaleMap[y];
      const nextRow = this.#grayscaleMap[y3];
      const gx = -prevRow[x1] + prevRow[x3] + -currentRow[x1] * 2 + currentRow[x3] * 2 + -nextRow[x1] + nextRow[x3];
      const gy = -prevRow[x1] + -prevRow[x] * 2 + -prevRow[x3] + nextRow[x1] + nextRow[x] * 2 + nextRow[x3];
      return (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
    }
    #computeForwardEnergy(x, y) {
      const data = this.#imageData.data;
      const leftX = x - 1;
      const rightX = x + 1;
      const horizontalCost = getColorDistance2(leftX, y, rightX, y, this.#width, data);
      const topY = y - 1;
      const bottomY = y + 1;
      const verticalCost = getColorDistance2(x, topY, x, bottomY, this.#width, data);
      return horizontalCost + verticalCost;
    }
    #detectBoundaryPenalty(x, y) {
      const data = this.#imageData.data;
      const gradientEnergy = this.#computeGradientEnergy(x, y);
      if (gradientEnergy < this.#edgeThreshold * 0.3) {
        return 0;
      }
      const leftVariance = getRegionVariance(x - 3, y, 2, this.#width, data);
      const rightVariance = getRegionVariance(x + 3, y, 2, this.#width, data);
      const topVariance = getRegionVariance(x, y - 3, 2, this.#width, data);
      const bottomVariance = getRegionVariance(x, y + 3, 2, this.#width, data);
      let boundaryStrength = 0;
      const minVariance = Math.min(leftVariance, rightVariance, topVariance, bottomVariance);
      if (minVariance < this.#uniformityThreshold * 0.5) {
        const uniformityFactor = Math.max(
          0,
          (this.#uniformityThreshold * 0.5 - minVariance) / (this.#uniformityThreshold * 0.5)
        );
        boundaryStrength = Math.max(boundaryStrength, uniformityFactor * 0.3);
      }
      const horizontalDiff = Math.abs(leftVariance - rightVariance);
      const verticalDiff = Math.abs(topVariance - bottomVariance);
      const maxTextureDiff = Math.max(horizontalDiff, verticalDiff);
      if (maxTextureDiff > this.#uniformityThreshold * 4 && gradientEnergy > this.#edgeThreshold) {
        const textureFactor = Math.min(1, maxTextureDiff / (this.#uniformityThreshold * 8));
        boundaryStrength = Math.max(boundaryStrength, textureFactor * 0.2);
      }
      if (gradientEnergy > this.#edgeThreshold * 2.5) {
        const strongEdgeFactor = Math.min(1, gradientEnergy / (this.#edgeThreshold * 4));
        boundaryStrength = Math.max(boundaryStrength, strongEdgeFactor * 0.15);
      }
      if (boundaryStrength > 0) {
        const edgeFactor = Math.min(1, gradientEnergy / (this.#edgeThreshold * 2));
        return boundaryStrength * edgeFactor * 200;
      }
      return 0;
    }
    #computeFullEnergyMap(width = this.#width, height = this.#height) {
      const energyMapData = new Array(height);
      for (let y = 0; y < height; y++) {
        energyMapData[y] = new Uint16Array(width);
        for (let x = 0; x < width; x++) {
          const gradientEnergy = this.#computeGradientEnergy(x, y);
          const forwardEnergy = this.#computeForwardEnergy(x, y);
          const boundaryPenalty = this.#detectBoundaryPenalty(x, y);
          const totalEnergy = gradientEnergy + forwardEnergy + this.#boundaryPenaltyWeight * boundaryPenalty;
          energyMapData[y][x] = Math.min(65535, Math.max(0, Math.round(totalEnergy)));
        }
      }
      return energyMapData;
    }
    get width() {
      return this.#width;
    }
    get height() {
      return this.#height;
    }
    get energyMap() {
      return this.#data;
    }
    get originalIndices() {
      return this.#originalIndices;
    }
    removeSeam(xIndices) {
      for (let y = 0; y < this.#height; y++) {
        const xToRemove = xIndices[y];
        this.#data[y] = deleteArrayIndices(this.#data[y], [xToRemove]);
        this.#originalIndices[y] = deleteArrayIndices(this.#originalIndices[y], [xToRemove]);
      }
      this.#width--;
      const newImageData = new ImageData(this.#width, this.#height);
      let writeIndex = 0;
      for (let y = 0; y < this.#height; y++) {
        const seamX = xIndices[y];
        for (let x = 0; x < this.#width + 1; x++) {
          if (x !== seamX) {
            const readIndex = (y * (this.#width + 1) + x) * 4;
            newImageData.data[writeIndex] = this.#imageData.data[readIndex];
            newImageData.data[writeIndex + 1] = this.#imageData.data[readIndex + 1];
            newImageData.data[writeIndex + 2] = this.#imageData.data[readIndex + 2];
            newImageData.data[writeIndex + 3] = this.#imageData.data[readIndex + 3];
            writeIndex += 4;
          }
        }
      }
      this.#imageData = newImageData;
      for (let y = 0; y < this.#height; y++) {
        const removedColOrigIdx = xIndices[y];
        const columnsInNewDataToUpdate = [];
        if (removedColOrigIdx > 0) {
          columnsInNewDataToUpdate.push(removedColOrigIdx - 1);
        }
        if (removedColOrigIdx < this.#width) {
          columnsInNewDataToUpdate.push(removedColOrigIdx);
        }
        for (const xCurrent of columnsInNewDataToUpdate) {
          const gradientEnergy = this.#computeGradientEnergy(xCurrent, y);
          const forwardEnergy = this.#computeForwardEnergy(xCurrent, y);
          const boundaryPenalty = this.#detectBoundaryPenalty(xCurrent, y);
          const totalEnergy = gradientEnergy + forwardEnergy + this.#boundaryPenaltyWeight * boundaryPenalty;
          this.#data[y][xCurrent] = Math.min(65535, Math.max(0, Math.round(totalEnergy)));
        }
      }
    }
    removeSeams(seams) {
      if (seams.length === 0) {
        return;
      }
      const numSeamsToRemove = seams.length;
      for (let y = 0; y < this.#height; y++) {
        const indicesToRemoveForRow = seams.map((seamPath) => seamPath[y]).sort((a, b) => a - b);
        this.#data[y] = deleteArrayIndices(this.#data[y], indicesToRemoveForRow);
        this.#grayscaleMap[y] = deleteArrayIndices(this.#grayscaleMap[y], indicesToRemoveForRow);
        this.#originalIndices[y] = deleteArrayIndices(
          this.#originalIndices[y],
          indicesToRemoveForRow
        );
      }
      this.#width -= numSeamsToRemove;
      const newImageData = new ImageData(this.#width, this.#height);
      let writeIndex = 0;
      for (let y = 0; y < this.#height; y++) {
        const indicesToRemove = seams.map((seamPath) => seamPath[y]).sort((a, b) => a - b);
        let removeIndex = 0;
        for (let x = 0; x < this.#width + numSeamsToRemove; x++) {
          if (removeIndex < indicesToRemove.length && x === indicesToRemove[removeIndex]) {
            removeIndex++;
            continue;
          }
          const readIndex = (y * (this.#width + numSeamsToRemove) + x) * 4;
          newImageData.data[writeIndex] = this.#imageData.data[readIndex];
          newImageData.data[writeIndex + 1] = this.#imageData.data[readIndex + 1];
          newImageData.data[writeIndex + 2] = this.#imageData.data[readIndex + 2];
          newImageData.data[writeIndex + 3] = this.#imageData.data[readIndex + 3];
          writeIndex += 4;
        }
      }
      this.#imageData = newImageData;
      this.#data = this.#computeFullEnergyMap();
    }
    getEnergyMapAsImageData(width = this.#width, height = this.#height) {
      const energyMapData = this.#computeFullEnergyMap(width, height);
      let minEnergy = Infinity;
      let maxEnergy = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const energy = energyMapData[y][x];
          if (energy < minEnergy) minEnergy = energy;
          if (energy > maxEnergy) maxEnergy = energy;
        }
      }
      const energyRange = maxEnergy - minEnergy;
      const imageData = new ImageData(width, height);
      const data = imageData.data;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const energy = energyMapData[y][x];
          const normalizedEnergy = energyRange > 0 ? Math.round((energy - minEnergy) / energyRange * 255) : 0;
          data[index] = normalizedEnergy;
          data[index + 1] = normalizedEnergy;
          data[index + 2] = normalizedEnergy;
          data[index + 3] = 255;
        }
      }
      return imageData;
    }
  };

  // src/generator/energy-map/energy-map.ts
  var ENERGY_ALGORITHM = "sobel";
  var CONFIG = {
    dual: {
      forwardEnergyWeight: 1
    },
    "boundary-aware": {
      boundaryPenaltyWeight: 5,
      uniformityThreshold: 10,
      edgeThreshold: 20
    },
    sobel: {}
  };
  function createEnergyMap(algorithm, imageData, maskData) {
    switch (algorithm) {
      case "sobel":
        return new SobelEnergyMap(imageData, maskData);
      case "dual":
        return new DualEnergyMap(imageData, CONFIG.dual.forwardEnergyWeight, maskData);
      case "boundary-aware":
        return new BoundaryAwareEnergyMap(
          imageData,
          CONFIG["boundary-aware"].boundaryPenaltyWeight,
          CONFIG["boundary-aware"].uniformityThreshold,
          CONFIG["boundary-aware"].edgeThreshold,
          maskData
        );
      default:
        const _exhaustive = algorithm;
        throw new Error(`Unknown energy map algorithm: ${algorithm}`);
    }
  }
  var EnergyMap = class EnergyMap2 {
    impl;
    constructor(imageData, maskData) {
      this.impl = createEnergyMap(ENERGY_ALGORITHM, imageData, maskData);
    }
    get width() {
      return this.impl.width;
    }
    get height() {
      return this.impl.height;
    }
    get energyMap() {
      return this.impl.energyMap;
    }
    get originalIndices() {
      return this.impl.originalIndices;
    }
    removeSeam(xIndices) {
      return this.impl.removeSeam(xIndices);
    }
    removeSeams(seams) {
      return this.impl.removeSeams(seams);
    }
    getEnergyMapAsImageData(width, height) {
      return this.impl.getEnergyMapAsImageData(width, height);
    }
  };

  // src/generator/base-generator/base-generator.ts
  var BaseGenerator = class {
    imageLoader;
    maskLoader;
    energyMapPromise;
    seamGrid = new Uint16Array();
    generatedSeams = 0;
    constructor(options) {
      this.imageLoader = options.imageLoader;
      this.maskLoader = options.maskLoader;
      this.energyMapPromise = this.createEnergyMap();
    }
    async createEnergyMap() {
      const imageData = await this.imageLoader.imageData;
      const maskData = await this.getMaskData();
      this.seamGrid = new Uint16Array(imageData.width * imageData.height).fill(
        65535
      );
      return new EnergyMap(imageData, maskData);
    }
    async getMaskData() {
      if (!this.maskLoader) return void 0;
      const maskData = await this.maskLoader.imageData;
      return getGrayscaleImageData(maskData, false);
    }
    async generateSeamGrid(minSeams) {
      const { width } = await this.imageLoader.image;
      if (width < minSeams) {
        throw new Error(`Cannot generate ${minSeams} seams for image with width ${width}`);
      }
      while (this.generatedSeams < minSeams) {
        await this.generateSeamBatch();
      }
      return this.seamGrid;
    }
  };

  // src/generator/random-generator/random-generator.ts
  var defaultOptions = {
    batchPercentage: 0.05,
    minBatchSize: 10
  };
  var RandomGenerator = class extends BaseGenerator {
    connections = [];
    options;
    constructor(options) {
      super(options);
      this.options = { ...defaultOptions, ...options };
    }
    setBatchPercentage(percentage) {
      this.options.batchPercentage = percentage;
    }
    async generateSeamBatch() {
      const energyMap = await this.energyMapPromise;
      const originalIndices = energyMap.originalIndices;
      const currentWidth = energyMap.width;
      const currentHeight = energyMap.height;
      this.generateConnections(currentWidth, currentHeight);
      const seams = Array.from({ length: currentWidth }, (_, ix) => this.getSeam(energyMap, ix));
      seams.sort((a, b) => a.energy - b.energy);
      const batchSize = Math.max(
        // the '>> 1 << 1' ensures that the batch size is even.
        Math.ceil(currentWidth * this.options.batchPercentage) >> 1 << 1,
        Math.min(this.options.minBatchSize, currentWidth)
      );
      const batchSeams = seams.slice(0, batchSize);
      let seamIndex = this.generatedSeams;
      for (let i = 0; i < batchSeams.length; i++) {
        const seam = batchSeams[i];
        seam.seam.forEach((x, y) => {
          const originalIndex = originalIndices[y][x];
          if (this.seamGrid[originalIndex] !== 65535) {
            throw new Error("Seam overlap detected");
          }
          this.seamGrid[originalIndex] = seamIndex;
        });
        seamIndex++;
      }
      energyMap.removeSeams(batchSeams.map((seam) => seam.seam));
      this.generatedSeams += batchSeams.length;
    }
    generateConnections(width, height) {
      const rndGenerator = deterministicBinaryRnd(width * height + 1);
      this.connections = Array.from({ length: height }, () => new Int8Array(width));
      const lastColIx = width - 1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (x === lastColIx || rndGenerator(y * width + x)) {
            this.connections[y][x] = 0;
          } else {
            this.connections[y][x] = 1;
            this.connections[y][x + 1] = -1;
            x++;
          }
        }
      }
    }
    getSeam(energyMap, ix) {
      const height = energyMap.height;
      const seam = new Uint16Array(height);
      const energyMapData = energyMap.energyMap;
      let energy = 0;
      let lastX = ix;
      for (let y = 0; y < height; y++) {
        seam[y] = lastX = lastX + this.connections[y][lastX];
        energy += energyMapData[y][lastX];
      }
      return { seam, energy };
    }
  };

  // src/generator/minimal-cumulative-energy-map/minimal-cumulative-energy-map.ts
  var cumulativeEnergyMapDefaultOptions = {
    constrainTo16Bit: false,
    constrainToDiagonals: false,
    accumulateUp: false
  };
  var MinimalCumulativeEnergyMap = class {
    #options;
    #minimalEnergyMap;
    #width;
    #height;
    constructor(options) {
      this.#options = {
        ...cumulativeEnergyMapDefaultOptions,
        ...options
      };
      this.#width = options.energyMap.width;
      this.#height = options.energyMap.height;
      this.#minimalEnergyMap = this.computeMinimalEnergyMap();
    }
    computeMinimalEnergyMap() {
      const { energyMap, constrainTo16Bit, constrainToDiagonals, accumulateUp } = this.#options;
      const { width, height } = energyMap;
      const minimalEnergyMap = new Array(height);
      const startingRow = accumulateUp ? height - 1 : 0;
      const endingRow = accumulateUp ? -1 : height;
      const increment = accumulateUp ? -1 : 1;
      const divisor = constrainTo16Bit ? height / 256 : 1;
      const shiftAmount = constrainTo16Bit ? Math.ceil(Math.log2(divisor)) : 0;
      const energyMapData = energyMap.energyMap;
      minimalEnergyMap[startingRow] = new (constrainTo16Bit ? Uint16Array : Uint32Array)(
        energyMapData[startingRow]
      );
      for (let row = startingRow + increment; row !== endingRow; row += increment) {
        minimalEnergyMap[row] = new (constrainTo16Bit ? Uint16Array : Uint32Array)(width);
        for (let col = 0; col < width; col++) {
          const energy = energyMapData[row][col];
          const prevLeftEnergy = minimalEnergyMap[row - increment][col - 1] ?? Infinity;
          const prevRightEnergy = minimalEnergyMap[row - increment][col + 1] ?? Infinity;
          const prevStraightEnergy = constrainToDiagonals ? Infinity : minimalEnergyMap[row - increment][col];
          const minEnergy = Math.min(prevLeftEnergy, prevRightEnergy, prevStraightEnergy);
          minimalEnergyMap[row][col] = energy + minEnergy >> shiftAmount;
        }
      }
      return minimalEnergyMap;
    }
    removeSeams(seams) {
      if (seams.length === 0) {
        return;
      }
      for (let y = 0; y < this.#height; y++) {
        const indicesToRemoveForRow = seams.map((seamPath) => seamPath[y]).sort((a, b) => a - b);
        this.#minimalEnergyMap[y] = deleteArrayIndices(
          this.#minimalEnergyMap[y],
          indicesToRemoveForRow
        );
      }
      this.#width -= seams.length;
    }
    get minimalEnergyMap() {
      return this.#minimalEnergyMap;
    }
  };

  // src/generator/predictive-generator/predictive-generator.ts
  var defaultOptions2 = {
    batchPercentage: 0.1,
    minBatchSize: 10
  };
  var PredictiveGenerator = class extends BaseGenerator {
    options;
    constructor(options) {
      super(options);
      this.options = { ...defaultOptions2, ...options };
    }
    setBatchPercentage(percentage) {
      this.options.batchPercentage = percentage;
    }
    async generateSeamBatch() {
      const energyMap = await this.energyMapPromise;
      const originalIndices = energyMap.originalIndices;
      const currentWidth = energyMap.width;
      const currentHeight = energyMap.height;
      const minimalCumulativeEnergyMap = new MinimalCumulativeEnergyMap({
        energyMap,
        accumulateUp: true
      });
      const minimalEnergyMapData = minimalCumulativeEnergyMap.minimalEnergyMap;
      const seams = [];
      const energyMapData = energyMap.energyMap;
      for (let x = 0; x < currentWidth; x++) {
        const initialEnergy = energyMapData[0][x];
        seams.push({
          path: new Uint16Array(currentHeight),
          energy: initialEnergy
        });
        seams[x].path[0] = x;
      }
      let currentSeamsAtIndex = seams;
      for (let y = 1; y < currentHeight; y++) {
        const nextSeamsAtIndex = [];
        for (let x = 0; x < currentWidth; x++) {
          const currentSeam = currentSeamsAtIndex[x];
          if (x === currentWidth - 1) {
            currentSeam.path[y] = x;
            currentSeam.energy += energyMapData[y][x];
            nextSeamsAtIndex[x] = currentSeam;
            continue;
          }
          const nextSeam = currentSeamsAtIndex[x + 1];
          const currentSeamLower = currentSeam.energy < nextSeam.energy;
          const currentPathLower = minimalEnergyMapData[y][x] < minimalEnergyMapData[y][x + 1];
          if (currentSeamLower === currentPathLower) {
            currentSeam.path[y] = x;
            currentSeam.energy += energyMapData[y][x];
            nextSeamsAtIndex[x] = currentSeam;
          } else {
            currentSeam.path[y] = x + 1;
            currentSeam.energy += energyMapData[y][x + 1];
            nextSeamsAtIndex[x + 1] = currentSeam;
            nextSeam.path[y] = x;
            nextSeam.energy += energyMapData[y][x];
            nextSeamsAtIndex[x] = nextSeam;
            x++;
          }
        }
        currentSeamsAtIndex = nextSeamsAtIndex;
      }
      seams.sort((a, b) => a.energy - b.energy);
      const batchSize = Math.max(
        // the '>> 1 << 1' ensures that the batch size is even.
        Math.ceil(currentWidth * this.options.batchPercentage) >> 1 << 1,
        Math.min(this.options.minBatchSize, currentWidth)
      );
      const batchSeams = seams.slice(0, batchSize);
      let seamIndex = this.generatedSeams;
      for (let i = 0; i < batchSeams.length; i++) {
        const seam = batchSeams[i];
        seam.path.forEach((x, y) => {
          const originalIndex = originalIndices[y][x];
          if (this.seamGrid[originalIndex] !== 65535) {
            throw new Error("Seam overlap detected");
          }
          this.seamGrid[originalIndex] = seamIndex;
        });
        seamIndex++;
      }
      energyMap.removeSeams(batchSeams.map((seam) => seam.path));
      this.generatedSeams += batchSeams.length;
    }
  };

  // src/generator/cached-generator/cached-generator.ts
  var defaultOptions3 = {
    cacheSpecificOption: ""
  };
  var CachedGenerator = class extends BaseGenerator {
    options;
    constructor(options) {
      super(options);
      this.options = { ...defaultOptions3, ...options };
    }
    async generateSeamBatch() {
    }
  };

  // src/generator/full-generator/full-generator.ts
  var FullGenerator = class extends BaseGenerator {
    constructor(options) {
      super(options);
    }
    async generateSeamBatch() {
    }
  };

  // src/generator/generator/generator.ts
  function createGenerator(type, options) {
    switch (type) {
      case "full":
        return new FullGenerator(options);
      case "cached":
        return new CachedGenerator(options);
      case "predictive":
        return new PredictiveGenerator(options);
      case "random":
      default:
        return new RandomGenerator(options);
    }
  }

  // src/utils/profiler/profiler.ts
  var Profiler = class {
    #log;
    #times = /* @__PURE__ */ new Map();
    #activeStack = [];
    constructor(log) {
      this.#log = log;
    }
    start(name, minLoggingTime = 0) {
      this.#times.set(name, {
        startTime: performance.now(),
        minLoggingTime,
        totalNestedTime: 0
      });
      this.#activeStack.push(name);
    }
    end(name) {
      const { startTime, minLoggingTime, totalNestedTime } = this.#times.get(name);
      const elapsedTime = performance.now() - startTime;
      if (elapsedTime < minLoggingTime) return;
      const stackSize = this.#activeStack.length;
      if (stackSize > 1) {
        const parentName = this.#activeStack[stackSize - 2];
        const parentData = this.#times.get(parentName);
        parentData.totalNestedTime += elapsedTime;
      }
      if (totalNestedTime > 0) {
        this.#log(
          `${name}: ${(elapsedTime - totalNestedTime).toFixed(2)}ms (${elapsedTime.toFixed(2)}ms)`
        );
      } else {
        this.#log(`${name}: ${(elapsedTime - totalNestedTime).toFixed(2)}ms`);
      }
      this.#activeStack.pop();
      this.#times.delete(name);
    }
  };

  // src/utils/error-boundary/error-boundary.ts
  function errorBoundary(originalMethod) {
    return function replacementMethod(...args) {
      if (this.hasFailed) {
        return;
      }
      try {
        const result = originalMethod.apply(this, args);
        if (result && typeof result.catch === "function") {
          return result.catch((error) => {
            this.handleFailure(error);
          });
        }
        return result;
      } catch (error) {
        this.handleFailure(error);
      }
    };
  }

  // src/utils/to-kebab-case/to-kebab-case.ts
  function toKebabCase(str) {
    return str.replace(/([A-Z])/g, "-$1").toLowerCase();
  }

  // src/utils/option-helpers/option-helpers.ts
  var createOptionGetters = (options) => {
    const getConstrainedNumber = (_name, defaultValue, min = 0, max = 1) => {
      const name = String(_name);
      const value = Number(options[toKebabCase(name)] ?? defaultValue);
      if (value < min || value > max) {
        throw new Error(`[Seams] \`${name}\` must be between ${min} and ${max}.`);
      }
      return value;
    };
    const getBoolean = (_name, defaultValue) => {
      const name = String(_name);
      const value = options[toKebabCase(name)];
      if (value === null) return false;
      return value !== void 0 ? true : defaultValue;
    };
    const getEnumValue = (_name, enumObject, defaultValue) => {
      const name = String(_name);
      const value = options[toKebabCase(name)];
      if (value === null || value === void 0) {
        return defaultValue;
      }
      const enumValues = Object.values(enumObject);
      if (enumValues.includes(value)) {
        return value;
      }
      console.warn(`[Seams] Invalid value for ${name}: "${value}". Defaulting to "${defaultValue}".`);
      return defaultValue;
    };
    return { getConstrainedNumber, getBoolean, getEnumValue };
  };

  // src/utils/enums/enums.ts
  var ScalingAxis = {
    Horizontal: "horizontal",
    Vertical: "vertical",
    Auto: "auto",
    Dual: "dual"
  };

  // src/renderer/renderer/renderer.ts
  var Renderer = class {
    canvas;
    ctx;
    height = 0;
    width = 0;
    imageLoader;
    maskLoader;
    options;
    generator;
    redrawQueued = false;
    profiler;
    hasFailed = false;
    parentNode;
    src;
    mask;
    cachedEnergyMapImageData = null;
    setOptions = errorBoundary(this._setOptions).bind(this);
    redraw = errorBoundary(this._redraw).bind(this);
    constructor(config) {
      const { parentNode, src, mask, ...options } = config;
      this.parentNode = parentNode;
      this.src = src;
      this.mask = mask;
      try {
        this.options = this.validateAndApplyDefaults(options);
        this.profiler = new Profiler(this.options.logger);
        this.imageLoader = new ImageLoader(src, {
          rotate: this.options.scalingAxis === "vertical",
          profiler: this.profiler
        });
        if (this.mask) {
          this.maskLoader = new ImageLoader(this.mask, {
            rotate: false,
            profiler: this.profiler
          });
        }
        this.generator = this.createGenerator();
        this.initializeCanvas(parentNode);
      } catch (e) {
        this.handleFailure(e);
      }
    }
    destroy() {
      this.canvas.remove();
    }
    createGenerator() {
      const options = {
        ...this.options,
        imageLoader: this.imageLoader,
        maskLoader: this.maskLoader
      };
      return createGenerator(this.options.generator, options);
    }
    validateAndApplyDefaults(options) {
      const { getBoolean, getConstrainedNumber, getEnumValue } = createOptionGetters(options);
      const newOptions = {
        ...options,
        carvingPriority: getConstrainedNumber("carvingPriority", 1),
        maxCarveUpSeamPercentage: getConstrainedNumber("maxCarveUpSeamPercentage", 0.6),
        maxCarveUpScale: getConstrainedNumber("maxCarveUpScale", 10, 1, 10),
        maxCarveDownScale: getConstrainedNumber("maxCarveDownScale", 1),
        scalingAxis: getEnumValue("scalingAxis", ScalingAxis, ScalingAxis.Horizontal),
        logger: options.logger ?? (() => {
        }),
        showEnergyMap: getBoolean("showEnergyMap", false),
        demoMode: getBoolean("demoMode", false)
      };
      return newOptions;
    }
    calculateDimensions(parentNode) {
      let { width, height } = this.options;
      if (width === void 0 || height === void 0) {
        const parentNodeSize = parentNode.getBoundingClientRect();
        width = width ?? parentNodeSize.width;
        height = height ?? parentNodeSize.height;
      }
      return { width, height };
    }
    initializeCanvas(parentNode) {
      const { width, height } = this.calculateDimensions(parentNode);
      this.canvas = document.createElement("canvas");
      this.ctx = this.canvas.getContext("2d");
      this.canvas.width = this.width = width;
      this.canvas.height = this.height = height;
      this.canvas.style.display = "block";
      parentNode.appendChild(this.canvas);
      this.queueRedraw();
    }
    setSize(width, height) {
      this.width = width;
      this.height = height;
      this.queueRedraw();
    }
    setWidth(width) {
      this.width = width;
      this.queueRedraw();
    }
    setHeight(height) {
      this.height = height;
      this.queueRedraw();
    }
    _setOptions(options) {
      const oldShowEnergyMap = this.options.showEnergyMap;
      this.options = this.validateAndApplyDefaults({
        ...this.options,
        ...options
      });
      if (this.options.showEnergyMap !== oldShowEnergyMap) {
        this.cachedEnergyMapImageData = null;
      }
      this.queueRedraw();
    }
    queueRedraw() {
      if (this.redrawQueued) {
        return;
      }
      this.redrawQueued = true;
      Promise.resolve().then(async () => {
        await this.redraw();
        this.redrawQueued = false;
      });
    }
    // The total number of seams to add or remove.
    determineCarvingParameters(imageData) {
      const { carvingPriority, maxCarveUpSeamPercentage, maxCarveUpScale, maxCarveDownScale } = this.options;
      const { width: originalWidth, height: originalHeight } = imageData;
      const targetAspectRatio = this.width / this.height;
      const targetWidth = Math.round(originalHeight * targetAspectRatio);
      const pixelDelta = originalWidth - targetWidth;
      if (pixelDelta === 0) {
        return { availableSeams: 0, interpolationPixels: 0, carveDown: false };
      }
      const seamsToCalculate = Math.abs(pixelDelta) * carvingPriority;
      const maxRatio = pixelDelta > 0 ? maxCarveDownScale : maxCarveUpSeamPercentage;
      const maxSeams = originalWidth * maxRatio;
      const direction = pixelDelta > 0 ? 1 : -1;
      const carveDown = pixelDelta > 0;
      const availableSeams = Math.floor(Math.min(seamsToCalculate, maxSeams)) * direction;
      if (carveDown) {
        return { availableSeams, interpolationPixels: 0, carveDown };
      } else {
        const targetEffectiveWidthByRatio = Math.round(originalHeight / this.height * this.width);
        const targetPixelsNeeded = targetEffectiveWidthByRatio - originalWidth;
        const maxCarveUpImageDataWidth = Math.floor(originalWidth * maxCarveUpScale);
        const maxPixelsByScale = maxCarveUpImageDataWidth - originalWidth;
        const totalPixelsToInsert = Math.max(0, Math.min(targetPixelsNeeded, maxPixelsByScale));
        const interpolationPixels = totalPixelsToInsert;
        return { availableSeams: -availableSeams, interpolationPixels, carveDown };
      }
    }
    async getEnergyMapImageData() {
      if (this.cachedEnergyMapImageData) {
        return this.cachedEnergyMapImageData;
      }
      const originalImageData = await this.imageLoader.imageData;
      const energyMap = new EnergyMap(originalImageData);
      this.cachedEnergyMapImageData = energyMap.getEnergyMapAsImageData();
      return this.cachedEnergyMapImageData;
    }
    async getSourceImageData() {
      if (this.options.showEnergyMap) {
        return await this.getEnergyMapImageData();
      } else {
        return await this.imageLoader.imageData;
      }
    }
    async _redraw() {
      this.profiler.start("redraw");
      const originalImageData = await this.getSourceImageData();
      const { availableSeams, interpolationPixels, carveDown } = this.determineCarvingParameters(originalImageData);
      let finalImageData;
      if (availableSeams === 0) {
        finalImageData = originalImageData;
      } else {
        this.profiler.start("generateSeamGrid", 1);
        const seamGrid = await this.generator.generateSeamGrid(availableSeams);
        this.profiler.end("generateSeamGrid");
        if (carveDown) {
          finalImageData = this.filterPixels(originalImageData, seamGrid, availableSeams);
        } else {
          finalImageData = this.interpolatePixels(
            originalImageData,
            seamGrid,
            availableSeams,
            interpolationPixels
          );
        }
      }
      this.canvas.width = finalImageData.width;
      this.canvas.height = finalImageData.height;
      this.ctx.putImageData(finalImageData, 0, 0);
      const styleRef = this.canvas.style;
      const isVertical = this.options.scalingAxis === "vertical";
      styleRef.transformOrigin = "0 0";
      styleRef.transform = isVertical ? "rotate(-90deg) translateX(-100%)" : "";
      styleRef.width = `${isVertical ? this.height : this.width}px`;
      styleRef.height = `${isVertical ? this.width : this.height}px`;
      this.profiler.end("redraw");
    }
    interpolatePixels(originalImageData, seamGrid, seamsAvailable, totalPixelsToInsert) {
      const { width: originalWidth, height, data: originalData } = originalImageData;
      const newWidth = originalWidth + totalPixelsToInsert;
      const newSize = newWidth * height * 4;
      const newData = new Uint8ClampedArray(newSize);
      let writeIndex = 0;
      const numPixels = originalData.length / 4;
      const basePixelsPerLocation = Math.floor(totalPixelsToInsert / seamsAvailable);
      const extraPixelsCount = totalPixelsToInsert % seamsAvailable;
      let x = 0;
      for (let readIndex = 0; readIndex < numPixels; readIndex++) {
        const priority = seamGrid[readIndex];
        const readIndexRgba = readIndex * 4;
        if (priority < seamsAvailable) {
          const addExtraPixel = extraPixelsCount > 0 && priority * extraPixelsCount % seamsAvailable < extraPixelsCount;
          const pixelsToInterpolate = addExtraPixel ? basePixelsPerLocation + 1 : basePixelsPerLocation;
          if (x === 0) {
            for (let i = 0; i < pixelsToInterpolate; i++) {
              newData[writeIndex] = originalData[readIndexRgba];
              newData[writeIndex + 1] = originalData[readIndexRgba + 1];
              newData[writeIndex + 2] = originalData[readIndexRgba + 2];
              newData[writeIndex + 3] = originalData[readIndexRgba + 3];
              writeIndex += 4;
            }
          } else {
            const leftReadIndexRgba = (readIndex - 1) * 4;
            const r0 = originalData[leftReadIndexRgba];
            const g0 = originalData[leftReadIndexRgba + 1];
            const b0 = originalData[leftReadIndexRgba + 2];
            const a0 = originalData[leftReadIndexRgba + 3];
            const dr = originalData[readIndexRgba] - r0;
            const dg = originalData[readIndexRgba + 1] - g0;
            const db = originalData[readIndexRgba + 2] - b0;
            const da = originalData[readIndexRgba + 3] - a0;
            const denominator = pixelsToInterpolate + 1;
            for (let i = 0; i < pixelsToInterpolate; i++) {
              const interpolationFactor = (i + 1) / denominator;
              newData[writeIndex] = Math.round(r0 + dr * interpolationFactor);
              newData[writeIndex + 1] = Math.round(g0 + dg * interpolationFactor);
              newData[writeIndex + 2] = Math.round(b0 + db * interpolationFactor);
              newData[writeIndex + 3] = Math.round(a0 + da * interpolationFactor);
              writeIndex += 4;
            }
          }
        }
        newData[writeIndex] = originalData[readIndexRgba];
        newData[writeIndex + 1] = originalData[readIndexRgba + 1];
        newData[writeIndex + 2] = originalData[readIndexRgba + 2];
        newData[writeIndex + 3] = originalData[readIndexRgba + 3];
        writeIndex += 4;
        if (++x === originalWidth) {
          x = 0;
        }
      }
      if (writeIndex !== newSize) {
        console.error(
          `[Seams] Mismatch during interpolation. Wrote ${writeIndex} bytes but expected ${newSize}.`
        );
      }
      return new ImageData(newData, newWidth, height);
    }
    filterPixels(originalImageData, seamGrid, seamsToRemove) {
      const { width: originalWidth, height, data: originalData } = originalImageData;
      const newWidth = originalWidth - seamsToRemove;
      const newSize = newWidth * height * 4;
      const newData = new Uint8ClampedArray(newSize);
      const numPixels = originalData.length / 4;
      let writeIndex = 0;
      for (let readIndex = 0; readIndex < numPixels; readIndex++) {
        const priority = seamGrid[readIndex];
        if (priority >= seamsToRemove) {
          const readIndexRgba = readIndex * 4;
          newData[writeIndex] = originalData[readIndexRgba];
          newData[writeIndex + 1] = originalData[readIndexRgba + 1];
          newData[writeIndex + 2] = originalData[readIndexRgba + 2];
          newData[writeIndex + 3] = originalData[readIndexRgba + 3];
          writeIndex += 4;
        }
      }
      if (writeIndex !== newSize) {
        console.error(
          `[Seams] Mismatch in pixel buffer size. Expected ${newSize}, but got ${writeIndex}.`
        );
      }
      return new ImageData(newData, newWidth, height);
    }
    handleFailure(error) {
      if (this.hasFailed) {
        return;
      }
      this.hasFailed = true;
      console.error("[Seams] A critical error occurred. Falling back to <img>.", error);
      if (this.canvas) {
        this.canvas.remove();
      }
      const { width, height } = this.options;
      const img = document.createElement("img");
      img.src = this.src;
      img.style.width = `${width}px`;
      img.style.height = `${height}px`;
      img.style.display = "block";
      this.parentNode.appendChild(img);
    }
  };

  // src/renderer/web-component/web-component.ts
  var ImgResponsive = class _ImgResponsive extends HTMLElement {
    GENERATOR;
    renderer = null;
    resizeObserver = null;
    intersectionObserver = null;
    updateQueue = /* @__PURE__ */ new Set();
    isIntersecting = false;
    storedDimensions = null;
    options = {};
    constructor() {
      super();
    }
    static get observedAttributes() {
      const seamAttributes = [
        "carvingPriority",
        "maxCarveUpSeamPercentage",
        "maxCarveUpScale",
        "maxCarveDownScale",
        "scalingAxis",
        "showEnergyMap",
        "demoMode"
      ];
      const kebabCaseAttributes = seamAttributes.map(toKebabCase);
      return ["src", "mask", "on-screen-threshold", ...kebabCaseAttributes];
    }
    connectedCallback() {
      this.setupResizeObserver();
      this.setupIntersectionObserver();
    }
    disconnectedCallback() {
      this.renderer?.destroy();
      this.renderer = null;
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      this.intersectionObserver?.disconnect();
      this.intersectionObserver = null;
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (!this.updateQueue.size) {
        setTimeout(this.processUpdates);
      }
      this.updateQueue.add(name);
    }
    processUpdates = () => {
      const changes = Array.from(this.updateQueue);
      this.updateQueue.clear();
      if (changes.includes("src") || changes.includes("scaling-axis") || changes.includes("mask")) {
        this.renderer?.destroy();
        this.renderer = null;
        this.initializeRenderer();
        return;
      }
      if (changes.includes("on-screen-threshold")) {
        this.setupIntersectionObserver();
      }
      if (!this.renderer) return;
      const otherOptions = changes.reduce(
        (acc, key) => {
          if (key !== "src" && key !== "on-screen-threshold") {
            const value = this.getAttribute(key);
            if (key === "show-energy-map") {
              acc[key] = value;
            } else if (value !== null) {
              acc[key] = value;
            }
          }
          return acc;
        },
        {}
      );
      this.renderer.setOptions(otherOptions);
    };
    dispatchLogEvent = (message) => {
      const event = new CustomEvent("log", {
        detail: { message },
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(event);
    };
    initializeRenderer() {
      if (this.renderer) {
        return;
      }
      const options = this.getOptions();
      this.renderer = new Renderer({
        parentNode: this,
        logger: this.dispatchLogEvent,
        generator: this.GENERATOR,
        ...options
      });
    }
    calculateDimensions() {
      const width = this.clientWidth ?? 100;
      const height = this.clientHeight ?? 100;
      return { width, height };
    }
    getOptions() {
      const options = {};
      for (const attr of _ImgResponsive.observedAttributes) {
        const kebabCaseAttr = toKebabCase(attr);
        if (this.hasAttribute(kebabCaseAttr)) {
          const value = this.getAttribute(kebabCaseAttr);
          if (value === "" || value === "true") {
            options[attr] = true;
          } else if (value === "false") {
            options[attr] = false;
          } else {
            options[attr] = this.getAttribute(kebabCaseAttr);
          }
        }
      }
      return options;
    }
    setupResizeObserver() {
      if (!this.parentElement) return;
      this.resizeObserver = new ResizeObserver(() => {
        const dimensions = this.calculateDimensions();
        this.storedDimensions = dimensions;
        this.attemptSetSize();
      });
      this.resizeObserver.observe(this);
    }
    setupIntersectionObserver() {
      this.intersectionObserver?.disconnect();
      const threshold = this.getAttribute("on-screen-threshold") || "50px";
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            this.isIntersecting = entry.isIntersecting;
            if (this.isIntersecting) {
              this.attemptSetSize();
            }
          }
        },
        {
          rootMargin: `${threshold} ${threshold} ${threshold} ${threshold}`
        }
      );
      this.intersectionObserver.observe(this);
    }
    attemptSetSize() {
      if (!this.isIntersecting || !this.storedDimensions) return;
      this.renderer?.setSize(this.storedDimensions.width, this.storedDimensions.height);
      this.storedDimensions = null;
    }
    get maxCarveUpScale() {
      return this.options["max-carve-up-scale"];
    }
    set maxCarveUpScale(value) {
      this.options["max-carve-up-scale"] = value;
      this.renderer?.setOptions({ maxCarveUpScale: value });
    }
    get scalingAxis() {
      return this.options["scaling-axis"];
    }
    set scalingAxis(value) {
      this.options["scaling-axis"] = value;
      this.renderer?.setOptions({ scalingAxis: value });
    }
    get showEnergyMap() {
      return this.options["show-energy-map"];
    }
    set showEnergyMap(value) {
      this.options["show-energy-map"] = value;
      this.renderer?.setOptions({ showEnergyMap: value });
    }
    get onScreenThreshold() {
      const threshold = this.getAttribute("on-screen-threshold") || "50px";
      return parseInt(threshold.replace("px", ""), 10);
    }
  };

  // src/renderer/web-component/web-component-predictive.ts
  var ImgResponsivePredictive = class extends ImgResponsive {
    GENERATOR = "predictive";
    constructor() {
      super();
    }
  };
  customElements.define("responsive-img-predictive", ImgResponsivePredictive);
})();
