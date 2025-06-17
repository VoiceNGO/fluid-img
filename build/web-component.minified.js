"use strict";
(() => {
  // build/utils/image-loader/image-loader.js
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
    constructor(src, options = {}) {
      this.#src = src;
      this.#rotate = options.rotate ?? false;
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
      return new Promise((resolve) => {
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext("2d");
        if (this.#rotate) {
          context.translate(image.width, 0);
          context.rotate(Math.PI / 2);
        }
        context.drawImage(image, 0, 0);
        resolve(context.getImageData(0, 0, image.width, image.height));
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

  // build/generator/full-generator/full-generator.js
  var FullGeneratorClass = class {
    #imageLoader;
    constructor(options) {
      this.#imageLoader = options.imageLoader;
    }
    async generateSeamGrid(minSeams) {
      return new Uint16Array();
    }
  };
  var FullGenerator = true ? FullGeneratorClass : throwGeneratorClass("FullGenerator");

  // build/generator/cached-generator/cached-generator.js
  var CachedGeneratorClass = class {
    #imageLoader;
    constructor(options) {
      this.#imageLoader = options.imageLoader;
    }
    async generateSeamGrid(minSeams) {
      return new Uint16Array();
    }
  };
  var CachedGenerator = true ? CachedGeneratorClass : throwGeneratorClass("CachedGenerator");

  // build/utils/deterministic-binary-rnd/deterministic-binary-rnd.js
  var deterministicBinaryRnd = (seed1) => (seed2) => {
    let h = seed1 ^ seed2;
    h ^= h >>> 16;
    h *= 2246822507;
    h ^= h >>> 13;
    h *= 3266489909;
    h ^= h >>> 16;
    return h & 1;
  };

  // build/utils/delete-array-indicies/delete-array-indicies.js
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

  // build/generator/energy-map/energy-map.js
  function getPixelIndex(x, y, width) {
    return (y * width + x) * 4;
  }
  function getGrayscale(x, y, width, data) {
    if (x < 0 || x >= width || y < 0 || y >= Math.floor(data.length / (width * 4))) {
      return 0;
    }
    const i = getPixelIndex(x, y, width);
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  var EnergyMap2D = class {
    #data;
    #width;
    #height;
    #grayscaleMap;
    #originalIndices;
    constructor(imageData) {
      this.#width = imageData.width;
      this.#height = imageData.height;
      this.#data = new Array(this.#height);
      this.#grayscaleMap = new Array(this.#height);
      this.#originalIndices = new Array(this.#height);
      this.#fillOriginalIndices();
      this.#computeGrayscaleMap(imageData);
      this.#computeFullEnergyMap();
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
    #computeFullEnergyMap() {
      this.#data = new Array(this.#height);
      for (let y = 0; y < this.#height; y++) {
        this.#data[y] = new Uint8Array(this.#width);
        const y1 = Math.max(0, y - 1);
        const y3 = Math.min(this.#height - 1, y + 1);
        const prevRow = this.#grayscaleMap[y1];
        const currentRow = this.#grayscaleMap[y];
        const nextRow = this.#grayscaleMap[y3];
        for (let x = 0; x < this.#width; x++) {
          const x1 = Math.max(0, x - 1);
          const x3 = Math.min(this.#width - 1, x + 1);
          const gx = -prevRow[x1] + prevRow[x3] + -currentRow[x1] * 2 + currentRow[x3] * 2 + -nextRow[x1] + nextRow[x3];
          const gy = -prevRow[x1] + -prevRow[x] * 2 + -prevRow[x3] + nextRow[x1] + nextRow[x] * 2 + nextRow[x3];
          const totalEnergy = (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
          this.#data[y][x] = totalEnergy >> 3;
        }
      }
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
          const totalEnergy = (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
          this.#data[y][xCurrent] = totalEnergy >> 3;
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
        this.#originalIndices[y] = deleteArrayIndices(this.#originalIndices[y], indicesToRemoveForRow);
      }
      this.#width -= numSeamsToRemove;
      this.#computeFullEnergyMap();
    }
  };

  // build/generator/random-generator/random-generator.js
  var defaultOptions = {
    batchPercentage: 0.1
  };
  var RandomGeneratorClass = class {
    #imageLoader;
    #energyMapPromise;
    #seamGrid = new Uint16Array();
    #connections = [];
    #generatedSeams = 0;
    #options;
    constructor(options) {
      this.#options = { ...defaultOptions, ...options };
      this.#imageLoader = options.imageLoader;
      this.#energyMapPromise = this.#createEnergyMap();
    }
    async #createEnergyMap() {
      const imageData = await this.#imageLoader.imageData;
      this.#seamGrid = new Uint16Array(imageData.width * imageData.height).fill(65535);
      return new EnergyMap2D(imageData);
    }
    setBatchPercentage(percentage) {
      this.#options.batchPercentage = percentage;
    }
    async #generateSeamBatch() {
      const energyMap = await this.#energyMapPromise;
      const originalIndices = energyMap.originalIndices;
      const currentWidth = energyMap.width;
      const currentHeight = energyMap.height;
      this.#generateRandomConnections(currentWidth, currentHeight);
      const seams = Array.from({ length: currentWidth }, (_, ix) => this.#getSeam(energyMap, ix));
      seams.sort((a, b) => a.energy - b.energy);
      const batchSize = Math.ceil(currentWidth * this.#options.batchPercentage) >> 1 << 1;
      const batchSeams = seams.slice(0, batchSize);
      let seamIndex = this.#generatedSeams;
      for (let i = 0; i < batchSeams.length; i++) {
        const seam = batchSeams[i];
        seam.seam.forEach((x, y) => {
          const originalIndex = originalIndices[y][x];
          if (this.#seamGrid[originalIndex] !== 65535) {
            throw new Error("Seam overlap detected");
          }
          this.#seamGrid[originalIndex] = seamIndex;
        });
        seamIndex++;
      }
      energyMap.removeSeams(batchSeams.map((seam) => seam.seam));
      this.#generatedSeams += batchSeams.length;
    }
    #generateRandomConnections(width, height) {
      const rndGenerator = deterministicBinaryRnd(width * height + 1);
      this.#connections = Array.from({ length: height }, () => new Int8Array(width));
      const lastRowIx = width - 1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (x === lastRowIx || rndGenerator(y * width + x)) {
            this.#connections[y][x] = 0;
          } else {
            this.#connections[y][x] = 1;
            this.#connections[y][x + 1] = -1;
            x++;
          }
        }
      }
    }
    #getSeam(energyMap, ix) {
      const height = energyMap.height;
      const seam = new Uint16Array(height);
      const energyMapData = energyMap.energyMap;
      let energy = 0;
      let lastX = ix;
      for (let y = 0; y < height; y++) {
        seam[y] = lastX = lastX + this.#connections[y][lastX];
        energy += energyMapData[y][lastX];
      }
      return { seam, energy };
    }
    async generateSeamGrid(minSeams) {
      const { width } = await this.#imageLoader.image;
      if (width < minSeams) {
        throw new Error(`Cannot generate ${minSeams} seams for image with width ${width}`);
      }
      while (this.#generatedSeams < minSeams) {
        await this.#generateSeamBatch();
      }
      return this.#seamGrid;
    }
  };
  var RandomGenerator = true ? RandomGeneratorClass : throwGeneratorClass("RandomGenerator");

  // build/renderer/renderer/renderer.js
  var Renderer = class {
    #canvas;
    #ctx;
    #height = 0;
    #width = 0;
    #imageLoader;
    #options;
    #generator;
    #redrawQueued = false;
    constructor(config) {
      const { parentNode, src, ...options } = config;
      this.#options = this.#validateAndApplyDefaults(options);
      this.#imageLoader = new ImageLoader(src, {
        rotate: this.#options.scalingAxis === "vertical"
      });
      this.#generator = this.#createGenerator();
      this.#initializeCanvas(parentNode);
    }
    destroy() {
      this.#canvas.remove();
    }
    #createGenerator() {
      const options = { ...this.#options, imageLoader: this.#imageLoader };
      switch (options.generator) {
        case "random":
          return new RandomGenerator(options);
        case "cached":
          return new CachedGenerator(options);
        default:
          return new FullGenerator(options);
      }
    }
    #validateAndApplyDefaults(options) {
      const getConstrainedNumber = (name, defaultValue, min = 0, max = 1) => {
        const value = options[name] ?? defaultValue;
        if (value < min || value > max) {
          throw new Error(`[Seams] \`${name}\` must be between ${min} and ${max}.`);
        }
        return value;
      };
      const newOptions = {
        ...options,
        carvingPriority: getConstrainedNumber("carvingPriority", 1),
        maxCarveUpSeamPercentage: getConstrainedNumber("maxCarveUpSeamPercentage", 0.6),
        maxCarveUpScale: getConstrainedNumber("maxCarveUpScale", 10, 1, 10),
        maxCarveDownScale: getConstrainedNumber("maxCarveDownScale", 0.1),
        scalingAxis: options.scalingAxis ?? "horizontal"
      };
      if (!newOptions.generator) {
        newOptions.generator = "full";
      }
      return newOptions;
    }
    #initializeCanvas(parentNode) {
      const parentNodeSize = parentNode.getBoundingClientRect();
      this.#canvas = document.createElement("canvas");
      this.#ctx = this.#canvas.getContext("2d");
      this.#canvas.width = this.#width = parentNodeSize.width;
      this.#canvas.height = this.#height = parentNodeSize.height;
      parentNode.appendChild(this.#canvas);
      this.#queueRedraw();
    }
    setSize(width, height) {
      this.#canvas.width = this.#width = width;
      this.#canvas.height = this.#height = height;
      this.#queueRedraw();
      return this;
    }
    setWidth(width) {
      this.#canvas.width = this.#width = width;
      this.#queueRedraw();
      return this;
    }
    setHeight(height) {
      this.#canvas.height = this.#height = height;
      this.#queueRedraw();
      return this;
    }
    setOptions(options) {
      this.#options = this.#validateAndApplyDefaults({
        ...this.#options,
        ...options
      });
      this.#queueRedraw();
      return this;
    }
    #queueRedraw() {
      if (this.#redrawQueued) {
        return;
      }
      this.#redrawQueued = true;
      Promise.resolve().then(async () => {
        await this.redraw();
        this.#redrawQueued = false;
      });
    }
    // The total number of seams to add or remove.
    #determineCarvingParameters(imageData) {
      const { carvingPriority, maxCarveUpSeamPercentage, maxCarveUpScale, maxCarveDownScale } = this.#options;
      const { width: originalWidth, height: originalHeight } = imageData;
      const aspectRatio = originalWidth / originalHeight;
      const scaledWidth = Math.round(this.#height * aspectRatio);
      const pixelDelta = scaledWidth - this.#width;
      if (pixelDelta === 0) {
        return { availableSeams: 0, interpolationPixels: 0 };
      }
      const seamsToCalculate = Math.abs(pixelDelta) * carvingPriority;
      const maxRatio = pixelDelta > 0 ? 1 - maxCarveDownScale : maxCarveUpSeamPercentage;
      const maxSeams = originalWidth * maxRatio;
      const direction = pixelDelta > 0 ? 1 : -1;
      const availableSeams = Math.floor(Math.min(seamsToCalculate, maxSeams)) * direction;
      if (direction === 1) {
        return { availableSeams, interpolationPixels: 0 };
      } else {
        const targetEffectiveWidthByRatio = Math.round(originalHeight / this.#height * this.#width);
        const targetPixelsNeeded = targetEffectiveWidthByRatio - originalWidth;
        const maxCarveUpImageDataWidth = Math.floor(originalWidth * maxCarveUpScale);
        const maxPixelsByScale = maxCarveUpImageDataWidth - originalWidth;
        const totalPixelsToInsert = Math.max(0, Math.min(targetPixelsNeeded, maxPixelsByScale));
        const interpolationPixels = totalPixelsToInsert;
        return { availableSeams, interpolationPixels };
      }
    }
    async redraw() {
      const originalImageLoader = this.#imageLoader;
      const originalImageData = await this.#imageLoader.imageData;
      if (this.#imageLoader !== originalImageLoader) {
        return this;
      }
      const { availableSeams, interpolationPixels } = this.#determineCarvingParameters(originalImageData);
      let finalImageData;
      if (availableSeams === 0) {
        finalImageData = originalImageData;
      } else {
        const seamGrid = await this.#generator.generateSeamGrid(Math.abs(availableSeams));
        if (availableSeams > 0) {
          finalImageData = this.#filterPixels(originalImageData, seamGrid, availableSeams);
        } else {
          finalImageData = this.#interpolatePixels(originalImageData, seamGrid, -availableSeams, interpolationPixels);
        }
      }
      this.#canvas.width = finalImageData.width;
      this.#canvas.height = finalImageData.height;
      this.#ctx.putImageData(finalImageData, 0, 0);
      const styleRef = this.#canvas.style;
      const isVertical = this.#options.scalingAxis === "vertical";
      styleRef.transformOrigin = "0 0";
      styleRef.transform = isVertical ? "rotate(-90deg) translateX(-100%)" : "";
      styleRef.width = `${isVertical ? this.#height : this.#width}px`;
      styleRef.height = `${isVertical ? this.#width : this.#height}px`;
      return this;
    }
    #interpolatePixels(originalImageData, seamGrid, seamsAvailable, totalPixelsToInsert) {
      const { width: originalWidth, height, data: originalData } = originalImageData;
      const newWidth = originalWidth + totalPixelsToInsert;
      const newSize = newWidth * height * 4;
      const newData = new Uint8ClampedArray(newSize);
      let writeIndex = 0;
      const numPixels = originalData.length / 4;
      const basePixelsPerLocation = Math.floor(totalPixelsToInsert / seamsAvailable);
      const extraPixelsCount = totalPixelsToInsert % seamsAvailable;
      for (let readIndex = 0; readIndex < numPixels; readIndex++) {
        const priority = seamGrid[readIndex];
        const readIndexRgba = readIndex * 4;
        if (priority < seamsAvailable) {
          const addExtraPixel = extraPixelsCount > 0 && priority * extraPixelsCount % seamsAvailable < extraPixelsCount;
          const pixelsToInterpolate = addExtraPixel ? basePixelsPerLocation + 1 : basePixelsPerLocation;
          for (let i = 0; i < pixelsToInterpolate; i++) {
            const x = readIndex % originalWidth;
            if (x === 0) {
              newData[writeIndex] = originalData[readIndexRgba];
              newData[writeIndex + 1] = originalData[readIndexRgba + 1];
              newData[writeIndex + 2] = originalData[readIndexRgba + 2];
              newData[writeIndex + 3] = originalData[readIndexRgba + 3];
            } else {
              const leftReadIndexRgba = (readIndex - 1) * 4;
              const interpolationFactor = (i + 1) / (pixelsToInterpolate + 1);
              newData[writeIndex] = Math.round(originalData[leftReadIndexRgba] + (originalData[readIndexRgba] - originalData[leftReadIndexRgba]) * interpolationFactor);
              newData[writeIndex + 1] = Math.round(originalData[leftReadIndexRgba + 1] + (originalData[readIndexRgba + 1] - originalData[leftReadIndexRgba + 1]) * interpolationFactor);
              newData[writeIndex + 2] = Math.round(originalData[leftReadIndexRgba + 2] + (originalData[readIndexRgba + 2] - originalData[leftReadIndexRgba + 2]) * interpolationFactor);
              newData[writeIndex + 3] = Math.round(originalData[leftReadIndexRgba + 3] + (originalData[readIndexRgba + 3] - originalData[leftReadIndexRgba + 3]) * interpolationFactor);
            }
            writeIndex += 4;
          }
        }
        newData[writeIndex] = originalData[readIndexRgba];
        newData[writeIndex + 1] = originalData[readIndexRgba + 1];
        newData[writeIndex + 2] = originalData[readIndexRgba + 2];
        newData[writeIndex + 3] = originalData[readIndexRgba + 3];
        writeIndex += 4;
      }
      if (writeIndex !== newSize) {
        console.error(`[Seams-1] Mismatch during interpolation. Wrote ${writeIndex} bytes but expected ${newSize}.`);
      }
      return new ImageData(newData, newWidth, height);
    }
    #filterPixels(originalImageData, seamGrid, seamsToRemove) {
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
        console.error(`[Seams-2] Mismatch in pixel buffer size. Expected ${newSize}, but got ${writeIndex}.`);
      }
      return new ImageData(newData, newWidth, height);
    }
  };

  // build/renderer/web-component/web-component.js
  function constrain(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }
  function parseNumber(val, fallback) {
    if (!val)
      return fallback;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  var ImgResponsive = class extends HTMLElement {
    renderer = null;
    resizeObserver = null;
    updateQueue = /* @__PURE__ */ new Set();
    constructor() {
      super();
    }
    static get observedAttributes() {
      return ["src", "width", "height", "min-width", "max-width", "min-height", "max-height"];
    }
    connectedCallback() {
      this.setupResizeObserver();
      this.initializeRenderer();
    }
    disconnectedCallback() {
      this.renderer?.destroy();
      this.renderer = null;
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue)
        return;
      if (!this.updateQueue.size) {
        setTimeout(this.processUpdates);
      }
      this.updateQueue.add(name);
    }
    processUpdates = () => {
      const changes = Array.from(this.updateQueue);
      this.updateQueue.clear();
      if (changes.includes("src")) {
        this.renderer?.destroy();
        this.renderer = null;
        this.initializeRenderer();
        return;
      }
      if (!this.renderer)
        return;
      const dimensionAttributes = [
        "width",
        "height",
        "min-width",
        "max-width",
        "min-height",
        "max-height"
      ];
      const hasDimensionChanges = changes.some((attr) => dimensionAttributes.includes(attr));
      const dimensions = hasDimensionChanges ? this.calculateDimensions() : {};
      const otherOptions = {};
      for (const attr of changes) {
        if (!dimensionAttributes.includes(attr)) {
          otherOptions[attr] = this.getAttribute(attr);
        }
      }
      this.renderer.setOptions({ ...dimensions, ...otherOptions });
    };
    initializeRenderer() {
      const src = this.getAttribute("src");
      if (!src)
        return;
      const options = this.getCurrentOptions();
      this.renderer = new Renderer({
        ...options,
        src,
        parentNode: this
      });
    }
    getNumericAttribute(name, fallback) {
      return parseNumber(this.getAttribute(name), fallback);
    }
    calculateDimensions(availableWidth, availableHeight) {
      if (availableWidth === void 0 || availableHeight === void 0) {
        availableWidth = this.parentElement?.clientWidth ?? 0;
        availableHeight = this.parentElement?.clientHeight ?? 0;
      }
      const requestedWidth = this.getNumericAttribute("width", Math.floor(availableWidth));
      const requestedHeight = this.getNumericAttribute("height", Math.floor(availableHeight));
      const minWidth = this.getNumericAttribute("min-width", 0);
      const maxWidth = this.getNumericAttribute("max-width", Infinity);
      const minHeight = this.getNumericAttribute("min-height", 0);
      const maxHeight = this.getNumericAttribute("max-height", Infinity);
      return {
        width: constrain(requestedWidth, minWidth, maxWidth),
        height: constrain(requestedHeight, minHeight, maxHeight),
        minWidth,
        maxWidth,
        minHeight,
        maxHeight
      };
    }
    getAllAttributes() {
      const attributes = {};
      for (let i = 0; i < this.attributes.length; i++) {
        const attr = this.attributes[i];
        if (!["src", "width", "height", "min-width", "max-width", "min-height", "max-height"].includes(attr.name)) {
          attributes[attr.name] = attr.value;
        }
      }
      return attributes;
    }
    getCurrentOptions() {
      const dimensions = this.calculateDimensions();
      const allAttributes = this.getAllAttributes();
      return {
        ...dimensions,
        ...allAttributes
      };
    }
    setupResizeObserver() {
      if (!this.parentElement)
        return;
      this.resizeObserver = new ResizeObserver((entries) => {
        const dimensions = this.calculateDimensions();
        this.renderer?.setSize(dimensions.width, dimensions.height);
      });
      this.resizeObserver.observe(this.parentElement);
    }
  };
  customElements.define("img-responsive", ImgResponsive);
})();
