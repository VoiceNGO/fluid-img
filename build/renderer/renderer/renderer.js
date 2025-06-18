import { ImageLoader } from '../../utils/image-loader/image-loader';
import { toCamelCase } from '../../utils/to-camel-case/to-camel-case';
import { FullGenerator } from '../../generator/full-generator/full-generator';
import { CachedGenerator, } from '../../generator/cached-generator/cached-generator';
import { RandomGenerator, } from '../../generator/random-generator/random-generator';
export class Renderer {
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
            rotate: this.#options.scalingAxis === 'vertical',
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
            case 'random':
                return new RandomGenerator(options);
            case 'cached':
                return new CachedGenerator(options);
            default:
                return new FullGenerator(options);
        }
    }
    #validateAndApplyDefaults(options) {
        const getConstrainedNumber = (name, defaultValue, min = 0, max = 1) => {
            const value = Number(options[toCamelCase(name)] ?? defaultValue);
            if (value < min || value > max) {
                throw new Error(`[Seams] \`${name}\` must be between ${min} and ${max}.`);
            }
            return value;
        };
        const newOptions = {
            ...options,
            carvingPriority: getConstrainedNumber('carvingPriority', 1),
            maxCarveUpSeamPercentage: getConstrainedNumber('maxCarveUpSeamPercentage', 0.6),
            maxCarveUpScale: getConstrainedNumber('maxCarveUpScale', 10, 1, 10),
            maxCarveDownScale: getConstrainedNumber('maxCarveDownScale', 0),
            scalingAxis: options.scalingAxis ?? 'horizontal',
        };
        if (!newOptions.generator) {
            newOptions.generator = 'full';
        }
        return newOptions;
    }
    #calculateDimensions(parentNode) {
        let { width, height } = this.#options;
        if (width === undefined || height === undefined) {
            const parentNodeSize = parentNode.getBoundingClientRect();
            width = width ?? parentNodeSize.width;
            height = height ?? parentNodeSize.height;
        }
        return { width, height };
    }
    #initializeCanvas(parentNode) {
        const { width, height } = this.#calculateDimensions(parentNode);
        this.#canvas = document.createElement('canvas');
        this.#ctx = this.#canvas.getContext('2d');
        this.#canvas.width = this.#width = width;
        this.#canvas.height = this.#height = height;
        this.#canvas.style.display = 'block';
        parentNode.appendChild(this.#canvas);
        this.#queueRedraw();
    }
    setSize(width, height) {
        this.#width = width;
        this.#height = height;
        this.#queueRedraw();
        return this;
    }
    setWidth(width) {
        this.#width = width;
        this.#queueRedraw();
        return this;
    }
    setHeight(height) {
        this.#height = height;
        this.#queueRedraw();
        return this;
    }
    setOptions(options) {
        this.#options = this.#validateAndApplyDefaults({
            ...this.#options,
            ...options,
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
        const targetAspectRatio = this.#width / this.#height;
        const targetWidth = Math.round(originalHeight * targetAspectRatio);
        const pixelDelta = originalWidth - targetWidth;
        //
        if (pixelDelta === 0) {
            return { availableSeams: 0, interpolationPixels: 0, carveDown: false };
        }
        const seamsToCalculate = Math.abs(pixelDelta) * carvingPriority;
        const maxRatio = pixelDelta > 0 ? 1 - maxCarveDownScale : maxCarveUpSeamPercentage;
        const maxSeams = originalWidth * maxRatio;
        const direction = pixelDelta > 0 ? 1 : -1;
        const carveDown = pixelDelta > 0;
        const availableSeams = Math.floor(Math.min(seamsToCalculate, maxSeams)) * direction;
        // if shrinking
        if (carveDown) {
            return { availableSeams, interpolationPixels: 0, carveDown };
        }
        else {
            // Calculate totalPixelsToInsert based on the effective target width driven by aspect ratio and canvas dimensions,
            // capped by maxCarveUpScale.
            const targetEffectiveWidthByRatio = Math.round((originalHeight / this.#height) * this.#width);
            const targetPixelsNeeded = targetEffectiveWidthByRatio - originalWidth;
            const maxCarveUpImageDataWidth = Math.floor(originalWidth * maxCarveUpScale);
            const maxPixelsByScale = maxCarveUpImageDataWidth - originalWidth;
            // The total pixels to insert is the minimum of what's needed for the target ratio, and what's allowed by maxCarveUpScale.
            const totalPixelsToInsert = Math.max(0, Math.min(targetPixelsNeeded, maxPixelsByScale));
            const interpolationPixels = totalPixelsToInsert;
            return { availableSeams: -availableSeams, interpolationPixels, carveDown };
        }
    }
    async redraw() {
        const originalImageData = await this.#imageLoader.imageData;
        const { availableSeams, interpolationPixels, carveDown } = this.#determineCarvingParameters(originalImageData);
        let finalImageData;
        if (availableSeams === 0) {
            finalImageData = originalImageData;
        }
        else {
            const seamGrid = await this.#generator.generateSeamGrid(availableSeams);
            if (carveDown) {
                finalImageData = this.#filterPixels(originalImageData, seamGrid, availableSeams);
            }
            else {
                finalImageData = this.#interpolatePixels(originalImageData, seamGrid, availableSeams, interpolationPixels);
            }
        }
        this.#canvas.width = finalImageData.width;
        this.#canvas.height = finalImageData.height;
        this.#ctx.putImageData(finalImageData, 0, 0);
        const styleRef = this.#canvas.style;
        const isVertical = this.#options.scalingAxis === 'vertical';
        styleRef.transformOrigin = '0 0';
        styleRef.transform = isVertical ? 'rotate(-90deg) translateX(-100%)' : '';
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
            // If this pixel is a seam to be "inserted", add an interpolated pixel first.
            if (priority < seamsAvailable) {
                // Determine how many pixels to interpolate for *this specific seam*
                // To interlace the extra pixels, we distribute them based on a calculated pattern
                // rather than front-loading them to the lowest priority indices.
                const addExtraPixel = extraPixelsCount > 0 && (priority * extraPixelsCount) % seamsAvailable < extraPixelsCount;
                const pixelsToInterpolate = addExtraPixel
                    ? basePixelsPerLocation + 1
                    : basePixelsPerLocation;
                for (let i = 0; i < pixelsToInterpolate; i++) {
                    const x = readIndex % originalWidth;
                    if (x === 0) {
                        // First column, just duplicate the pixel
                        newData[writeIndex] = originalData[readIndexRgba];
                        newData[writeIndex + 1] = originalData[readIndexRgba + 1];
                        newData[writeIndex + 2] = originalData[readIndexRgba + 2];
                        newData[writeIndex + 3] = originalData[readIndexRgba + 3];
                    }
                    else {
                        // Interpolate with the pixel to the left
                        const leftReadIndexRgba = (readIndex - 1) * 4;
                        // Calculate interpolation factor for the current interpolated pixel
                        const interpolationFactor = (i + 1) / (pixelsToInterpolate + 1);
                        newData[writeIndex] = Math.round(originalData[leftReadIndexRgba] +
                            (originalData[readIndexRgba] - originalData[leftReadIndexRgba]) *
                                interpolationFactor);
                        newData[writeIndex + 1] = Math.round(originalData[leftReadIndexRgba + 1] +
                            (originalData[readIndexRgba + 1] - originalData[leftReadIndexRgba + 1]) *
                                interpolationFactor);
                        newData[writeIndex + 2] = Math.round(originalData[leftReadIndexRgba + 2] +
                            (originalData[readIndexRgba + 2] - originalData[leftReadIndexRgba + 2]) *
                                interpolationFactor);
                        newData[writeIndex + 3] = Math.round(originalData[leftReadIndexRgba + 3] +
                            (originalData[readIndexRgba + 3] - originalData[leftReadIndexRgba + 3]) *
                                interpolationFactor);
                    }
                    writeIndex += 4;
                }
            }
            // Always write the original pixel
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
}
