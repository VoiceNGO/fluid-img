"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
  var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
  var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
  var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
  var __decoratorContext = (kind, name, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
  var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
  var __runInitializers = (array, flags, self, value) => {
    for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
    return value;
  };
  var __decorateElement = (array, flags, name, decorators, target, extra) => {
    var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
    var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
    var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
    var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name]() {
      return __privateGet(this, extra);
    }, set [name](x) {
      return __privateSet(this, extra, x);
    } }, name));
    k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
    for (var i = decorators.length - 1; i >= 0; i--) {
      ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
      if (k) {
        ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name in x };
        if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name];
        if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name] = y;
      }
      it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
      if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
      else if (typeof it !== "object" || it === null) __typeError("Object expected");
      else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
    }
    return k || __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
  };
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
  var __privateWrapper = (obj, member, setter, getter) => ({
    set _(value) {
      __privateSet(obj, member, value, setter);
    },
    get _() {
      return __privateGet(obj, member, getter);
    }
  });

  // src/utils/image-loader/image-loader.ts
  var _rotate;
  var EvenWidthImage = class extends Image {
    constructor(options = {}) {
      super();
      __privateAdd(this, _rotate);
      this.crossOrigin = `Anonymous`;
      __privateSet(this, _rotate, !!options.rotate);
    }
    get width() {
      const originalWidth = __privateGet(this, _rotate) ? super.height : super.width;
      return originalWidth - originalWidth % 2;
    }
    get height() {
      return __privateGet(this, _rotate) ? super.width : super.height;
    }
  };
  _rotate = new WeakMap();
  var _src, _imgPromise, _imageDataPromise, _rotate2, _profiler, _ImageLoader_instances, loadImage_fn, loadImageData_fn;
  var ImageLoader = class {
    constructor(src, options) {
      __privateAdd(this, _ImageLoader_instances);
      __privateAdd(this, _src);
      __privateAdd(this, _imgPromise);
      __privateAdd(this, _imageDataPromise);
      __privateAdd(this, _rotate2);
      __privateAdd(this, _profiler);
      __privateSet(this, _src, src);
      __privateSet(this, _rotate2, options.rotate);
      __privateSet(this, _profiler, options.profiler);
      __privateSet(this, _imgPromise, __privateMethod(this, _ImageLoader_instances, loadImage_fn).call(this));
      __privateSet(this, _imageDataPromise, __privateGet(this, _imgPromise).then((img) => __privateMethod(this, _ImageLoader_instances, loadImageData_fn).call(this, img)));
    }
    get src() {
      return __privateGet(this, _src);
    }
    get image() {
      return __privateGet(this, _imgPromise);
    }
    get imageData() {
      return __privateGet(this, _imageDataPromise);
    }
  };
  _src = new WeakMap();
  _imgPromise = new WeakMap();
  _imageDataPromise = new WeakMap();
  _rotate2 = new WeakMap();
  _profiler = new WeakMap();
  _ImageLoader_instances = new WeakSet();
  loadImage_fn = function() {
    return new Promise((resolve, reject) => {
      const src = __privateGet(this, _src);
      const img = new EvenWidthImage({ rotate: __privateGet(this, _rotate2) });
      img.onload = () => resolve(img);
      img.onerror = () => reject(`Failed to load image: ${src}`);
      img.onabort = () => reject(`Image loading aborted: ${src}`);
      img.src = src;
    });
  };
  loadImageData_fn = function(image) {
    const profiler = __privateGet(this, _profiler);
    return new Promise((resolve) => {
      profiler.start("loadImageData");
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext("2d");
      if (__privateGet(this, _rotate2)) {
        context.translate(image.width, 0);
        context.rotate(Math.PI / 2);
      }
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, image.width, image.height);
      profiler.end("loadImageData");
      resolve(imageData);
    });
  };

  // src/utils/throw-generator-class/throw-generator-class.ts
  function throwGeneratorClass(className) {
    return class ThrowGeneratorClass {
      constructor() {
        throw new Error(`${className} is not implemented`);
      }
      generateSeamGrid() {
        throw new Error(`${className} is not implemented`);
      }
    };
  }

  // src/generator/full-generator/full-generator.ts
  var FullGenerator = false ? FullGeneratorClass : throwGeneratorClass("FullGenerator");

  // src/generator/cached-generator/cached-generator.ts
  var CachedGenerator = false ? CachedGeneratorClass : throwGeneratorClass("CachedGenerator");

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

  // src/generator/energy-map/energy-map.ts
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
  var _data, _width, _height, _grayscaleMap, _originalIndices, _EnergyMap2D_instances, fillOriginalIndices_fn, computeGrayscaleMap_fn, computeFullEnergyMap_fn;
  var EnergyMap2D = class {
    constructor(imageData) {
      __privateAdd(this, _EnergyMap2D_instances);
      __privateAdd(this, _data);
      __privateAdd(this, _width);
      __privateAdd(this, _height);
      __privateAdd(this, _grayscaleMap);
      __privateAdd(this, _originalIndices);
      __privateSet(this, _width, imageData.width);
      __privateSet(this, _height, imageData.height);
      __privateSet(this, _data, new Array(__privateGet(this, _height)));
      __privateSet(this, _grayscaleMap, new Array(__privateGet(this, _height)));
      __privateSet(this, _originalIndices, new Array(__privateGet(this, _height)));
      __privateMethod(this, _EnergyMap2D_instances, fillOriginalIndices_fn).call(this);
      __privateMethod(this, _EnergyMap2D_instances, computeGrayscaleMap_fn).call(this, imageData);
      __privateMethod(this, _EnergyMap2D_instances, computeFullEnergyMap_fn).call(this);
    }
    get width() {
      return __privateGet(this, _width);
    }
    get height() {
      return __privateGet(this, _height);
    }
    get energyMap() {
      return __privateGet(this, _data);
    }
    get originalIndices() {
      return __privateGet(this, _originalIndices);
    }
    removeSeam(xIndices) {
      for (let y = 0; y < __privateGet(this, _height); y++) {
        const xToRemove = xIndices[y];
        __privateGet(this, _data)[y] = deleteArrayIndices(__privateGet(this, _data)[y], [xToRemove]);
        __privateGet(this, _originalIndices)[y] = deleteArrayIndices(__privateGet(this, _originalIndices)[y], [xToRemove]);
      }
      __privateWrapper(this, _width)._--;
      const g = (colInNewCoord, removedOriginalIndex) => colInNewCoord < removedOriginalIndex ? colInNewCoord : colInNewCoord + 1;
      for (let y = 0; y < __privateGet(this, _height); y++) {
        const removedColOrigIdx = xIndices[y];
        const y1 = Math.max(0, y - 1);
        const y3 = Math.min(__privateGet(this, _height) - 1, y + 1);
        const prevRow = __privateGet(this, _grayscaleMap)[y1];
        const currentRow = __privateGet(this, _grayscaleMap)[y];
        const nextRow = __privateGet(this, _grayscaleMap)[y3];
        const columnsInNewDataToUpdate = [];
        if (removedColOrigIdx > 0) {
          columnsInNewDataToUpdate.push(removedColOrigIdx - 1);
        }
        if (removedColOrigIdx < __privateGet(this, _width)) {
          columnsInNewDataToUpdate.push(removedColOrigIdx);
        }
        for (const xCurrent of columnsInNewDataToUpdate) {
          const x1 = Math.max(0, g(xCurrent - 1, removedColOrigIdx));
          const x3 = Math.min(__privateGet(this, _grayscaleMap)[0].length - 1, g(xCurrent + 1, removedColOrigIdx));
          const xCenter = g(xCurrent, removedColOrigIdx);
          const gx = -prevRow[x1] + prevRow[x3] + -currentRow[x1] * 2 + currentRow[x3] * 2 + -nextRow[x1] + nextRow[x3];
          const gy = -prevRow[x1] + -prevRow[xCenter] * 2 + -prevRow[x3] + nextRow[x1] + nextRow[xCenter] * 2 + nextRow[x3];
          const totalEnergy = (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
          __privateGet(this, _data)[y][xCurrent] = totalEnergy >> 3;
        }
      }
    }
    removeSeams(seams) {
      if (seams.length === 0) {
        return;
      }
      const numSeamsToRemove = seams.length;
      for (let y = 0; y < __privateGet(this, _height); y++) {
        const indicesToRemoveForRow = seams.map((seamPath) => seamPath[y]).sort((a, b) => a - b);
        __privateGet(this, _data)[y] = deleteArrayIndices(__privateGet(this, _data)[y], indicesToRemoveForRow);
        __privateGet(this, _grayscaleMap)[y] = deleteArrayIndices(__privateGet(this, _grayscaleMap)[y], indicesToRemoveForRow);
        __privateGet(this, _originalIndices)[y] = deleteArrayIndices(
          __privateGet(this, _originalIndices)[y],
          indicesToRemoveForRow
        );
      }
      __privateSet(this, _width, __privateGet(this, _width) - numSeamsToRemove);
      __privateMethod(this, _EnergyMap2D_instances, computeFullEnergyMap_fn).call(this);
    }
  };
  _data = new WeakMap();
  _width = new WeakMap();
  _height = new WeakMap();
  _grayscaleMap = new WeakMap();
  _originalIndices = new WeakMap();
  _EnergyMap2D_instances = new WeakSet();
  fillOriginalIndices_fn = function() {
    for (let y = 0; y < __privateGet(this, _height); y++) {
      __privateGet(this, _originalIndices)[y] = new Uint32Array(__privateGet(this, _width));
      for (let x = 0; x < __privateGet(this, _width); x++) {
        __privateGet(this, _originalIndices)[y][x] = y * __privateGet(this, _width) + x;
      }
    }
  };
  computeGrayscaleMap_fn = function(imageData) {
    for (let y = 0; y < __privateGet(this, _height); y++) {
      __privateGet(this, _grayscaleMap)[y] = new Uint8Array(__privateGet(this, _width));
      for (let x = 0; x < __privateGet(this, _width); x++) {
        __privateGet(this, _grayscaleMap)[y][x] = getGrayscale(x, y, __privateGet(this, _width), imageData.data);
      }
    }
  };
  computeFullEnergyMap_fn = function() {
    __privateSet(this, _data, new Array(__privateGet(this, _height)));
    for (let y = 0; y < __privateGet(this, _height); y++) {
      __privateGet(this, _data)[y] = new Uint8Array(__privateGet(this, _width));
      const y1 = Math.max(0, y - 1);
      const y3 = Math.min(__privateGet(this, _height) - 1, y + 1);
      const prevRow = __privateGet(this, _grayscaleMap)[y1];
      const currentRow = __privateGet(this, _grayscaleMap)[y];
      const nextRow = __privateGet(this, _grayscaleMap)[y3];
      for (let x = 0; x < __privateGet(this, _width); x++) {
        const x1 = Math.max(0, x - 1);
        const x3 = Math.min(__privateGet(this, _width) - 1, x + 1);
        const gx = -prevRow[x1] + prevRow[x3] + -currentRow[x1] * 2 + currentRow[x3] * 2 + -nextRow[x1] + nextRow[x3];
        const gy = -prevRow[x1] + -prevRow[x] * 2 + -prevRow[x3] + nextRow[x1] + nextRow[x] * 2 + nextRow[x3];
        const totalEnergy = (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
        __privateGet(this, _data)[y][x] = totalEnergy >> 3;
      }
    }
  };

  // src/generator/random-generator/random-generator.ts
  var defaultOptions = {
    batchPercentage: 0.05,
    minBatchSize: 10
  };
  var _imageLoader, _energyMapPromise, _seamGrid, _connections, _generatedSeams, _options, _RandomGeneratorClass_instances, createEnergyMap_fn, generateSeamBatch_fn, generateRandomConnections_fn, getSeam_fn;
  var RandomGeneratorClass = class {
    constructor(options) {
      __privateAdd(this, _RandomGeneratorClass_instances);
      __privateAdd(this, _imageLoader);
      __privateAdd(this, _energyMapPromise);
      __privateAdd(this, _seamGrid, new Uint16Array());
      __privateAdd(this, _connections, []);
      __privateAdd(this, _generatedSeams, 0);
      __privateAdd(this, _options);
      __privateSet(this, _options, { ...defaultOptions, ...options });
      __privateSet(this, _imageLoader, options.imageLoader);
      __privateSet(this, _energyMapPromise, __privateMethod(this, _RandomGeneratorClass_instances, createEnergyMap_fn).call(this));
    }
    setBatchPercentage(percentage) {
      __privateGet(this, _options).batchPercentage = percentage;
    }
    async generateSeamGrid(minSeams) {
      const { width } = await __privateGet(this, _imageLoader).image;
      if (width < minSeams) {
        throw new Error(`Cannot generate ${minSeams} seams for image with width ${width}`);
      }
      while (__privateGet(this, _generatedSeams) < minSeams) {
        await __privateMethod(this, _RandomGeneratorClass_instances, generateSeamBatch_fn).call(this);
      }
      return __privateGet(this, _seamGrid);
    }
  };
  _imageLoader = new WeakMap();
  _energyMapPromise = new WeakMap();
  _seamGrid = new WeakMap();
  _connections = new WeakMap();
  _generatedSeams = new WeakMap();
  _options = new WeakMap();
  _RandomGeneratorClass_instances = new WeakSet();
  createEnergyMap_fn = async function() {
    const imageData = await __privateGet(this, _imageLoader).imageData;
    __privateSet(this, _seamGrid, new Uint16Array(imageData.width * imageData.height).fill(
      65535
    ));
    return new EnergyMap2D(imageData);
  };
  generateSeamBatch_fn = async function() {
    const energyMap = await __privateGet(this, _energyMapPromise);
    const originalIndices = energyMap.originalIndices;
    const currentWidth = energyMap.width;
    const currentHeight = energyMap.height;
    __privateMethod(this, _RandomGeneratorClass_instances, generateRandomConnections_fn).call(this, currentWidth, currentHeight);
    const seams = Array.from({ length: currentWidth }, (_, ix) => __privateMethod(this, _RandomGeneratorClass_instances, getSeam_fn).call(this, energyMap, ix));
    seams.sort((a, b) => a.energy - b.energy);
    const batchSize = Math.max(
      // the '>> 1 << 1' ensures that the batch size is even.
      Math.ceil(currentWidth * __privateGet(this, _options).batchPercentage) >> 1 << 1,
      Math.min(__privateGet(this, _options).minBatchSize, currentWidth)
    );
    const batchSeams = seams.slice(0, batchSize);
    let seamIndex = __privateGet(this, _generatedSeams);
    for (let i = 0; i < batchSeams.length; i++) {
      const seam = batchSeams[i];
      seam.seam.forEach((x, y) => {
        const originalIndex = originalIndices[y][x];
        if (__privateGet(this, _seamGrid)[originalIndex] !== 65535) {
          throw new Error("Seam overlap detected");
        }
        __privateGet(this, _seamGrid)[originalIndex] = seamIndex;
      });
      seamIndex++;
    }
    energyMap.removeSeams(batchSeams.map((seam) => seam.seam));
    __privateSet(this, _generatedSeams, __privateGet(this, _generatedSeams) + batchSeams.length);
  };
  generateRandomConnections_fn = function(width, height) {
    const rndGenerator = deterministicBinaryRnd(width * height + 1);
    __privateSet(this, _connections, Array.from({ length: height }, () => new Int8Array(width)));
    const lastRowIx = width - 1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === lastRowIx || rndGenerator(y * width + x)) {
          __privateGet(this, _connections)[y][x] = 0;
        } else {
          __privateGet(this, _connections)[y][x] = 1;
          __privateGet(this, _connections)[y][x + 1] = -1;
          x++;
        }
      }
    }
  };
  getSeam_fn = function(energyMap, ix) {
    const height = energyMap.height;
    const seam = new Uint16Array(height);
    const energyMapData = energyMap.energyMap;
    let energy = 0;
    let lastX = ix;
    for (let y = 0; y < height; y++) {
      seam[y] = lastX = lastX + __privateGet(this, _connections)[y][lastX];
      energy += energyMapData[y][lastX];
    }
    return { seam, energy };
  };
  var RandomGenerator = true ? RandomGeneratorClass : throwGeneratorClass2("RandomGenerator");

  // src/utils/to-kebab-case/to-kebab-case.ts
  function toKebabCase(str) {
    return str.replace(/([A-Z])/g, "-$1").toLowerCase();
  }

  // src/utils/profiler/profiler.ts
  var _log, _times, _activeStack;
  var Profiler = class {
    constructor(log) {
      __privateAdd(this, _log);
      __privateAdd(this, _times, /* @__PURE__ */ new Map());
      __privateAdd(this, _activeStack, []);
      __privateSet(this, _log, log);
    }
    start(name, minLoggingTime = 0) {
      __privateGet(this, _times).set(name, {
        startTime: performance.now(),
        minLoggingTime,
        totalNestedTime: 0
      });
      __privateGet(this, _activeStack).push(name);
    }
    end(name) {
      const { startTime, minLoggingTime, totalNestedTime } = __privateGet(this, _times).get(name);
      const elapsedTime = performance.now() - startTime;
      if (elapsedTime < minLoggingTime) return;
      const stackSize = __privateGet(this, _activeStack).length;
      if (stackSize > 1) {
        const parentName = __privateGet(this, _activeStack)[stackSize - 2];
        const parentData = __privateGet(this, _times).get(parentName);
        parentData.totalNestedTime += elapsedTime;
      }
      if (totalNestedTime > 0) {
        __privateGet(this, _log).call(this, `${name}: ${(elapsedTime - totalNestedTime).toFixed(2)}ms (${elapsedTime.toFixed(2)}ms)`);
      } else {
        __privateGet(this, _log).call(this, `${name}: ${(elapsedTime - totalNestedTime).toFixed(2)}ms`);
      }
      __privateGet(this, _activeStack).pop();
      __privateGet(this, _times).delete(name);
    }
  };
  _log = new WeakMap();
  _times = new WeakMap();
  _activeStack = new WeakMap();

  // src/renderer/renderer/renderer.ts
  function errorBoundary(originalMethod, _context) {
    function replacementMethod(...args) {
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
    }
    return replacementMethod;
  }
  var _redraw_dec, _setOptions_dec, _init;
  _setOptions_dec = [errorBoundary], _redraw_dec = [errorBoundary];
  var Renderer = class {
    constructor(config) {
      __runInitializers(_init, 5, this);
      __publicField(this, "canvas");
      __publicField(this, "ctx");
      __publicField(this, "height", 0);
      __publicField(this, "width", 0);
      __publicField(this, "imageLoader");
      __publicField(this, "options");
      __publicField(this, "generator");
      __publicField(this, "redrawQueued", false);
      __publicField(this, "profiler");
      __publicField(this, "hasFailed", false);
      __publicField(this, "parentNode");
      __publicField(this, "src");
      const { parentNode, src, ...options } = config;
      this.parentNode = parentNode;
      this.src = src;
      try {
        this.options = this.validateAndApplyDefaults(options);
        this.profiler = new Profiler(this.options.logger);
        this.imageLoader = new ImageLoader(src, {
          rotate: this.options.scalingAxis === "vertical",
          profiler: this.profiler
        });
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
      const options = { ...this.options, imageLoader: this.imageLoader };
      switch (options.generator) {
        case "random":
          return new RandomGenerator(options);
        case "cached":
          return new CachedGenerator(options);
        default:
          return new FullGenerator(options);
      }
    }
    validateAndApplyDefaults(options) {
      const getConstrainedNumber = (name, defaultValue, min = 0, max = 1) => {
        const value = Number(options[toKebabCase(name)] ?? defaultValue);
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
        maxCarveDownScale: getConstrainedNumber("maxCarveDownScale", 1),
        scalingAxis: options.scalingAxis ?? "horizontal",
        logger: options.logger ?? (() => {
        })
      };
      if (!newOptions.generator) {
        newOptions.generator = "random";
      }
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
    setOptions(options) {
      this.options = this.validateAndApplyDefaults({
        ...this.options,
        ...options
      });
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
    async redraw() {
      this.profiler.start("redraw");
      const originalImageData = await this.imageLoader.imageData;
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
      const img = document.createElement("img");
      img.src = this.src;
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.display = "block";
      this.parentNode.appendChild(img);
    }
  };
  _init = __decoratorStart(null);
  __decorateElement(_init, 1, "setOptions", _setOptions_dec, Renderer);
  __decorateElement(_init, 1, "redraw", _redraw_dec, Renderer);
  __decoratorMetadata(_init, Renderer);
})();
