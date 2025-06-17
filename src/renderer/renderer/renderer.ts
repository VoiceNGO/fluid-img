import { ImageLoader } from '../../utils/image-loader/image-loader';
import { SeamPixelPriorityGrid } from '../../utils/seam-spec/seam-spec';
import { FullGenerator, FullGeneratorOptions } from '../../generator/full-generator/full-generator';
import {
  CachedGenerator,
  CachedGeneratorOptions,
} from '../../generator/cached-generator/cached-generator';
import {
  RandomGenerator,
  RandomGeneratorOptions,
} from '../../generator/random-generator/random-generator';
import { ConditionalKeys } from 'type-fest';

export interface SeamGenerator {
  generateSeamGrid(minSeams: number): Promise<SeamPixelPriorityGrid>;
}

type GeneralOptions = {
  carvingPriority?: number;
  maxCarveUpSeamPercentage?: number;
  maxCarveUpScale?: number;
  maxCarveDownScale?: number;
  scalingAxis?: 'horizontal' | 'vertical';
};

// filter out options that the renderer provides internally
type FilterGeneratorOptions<T> = Omit<T, 'imageLoader'>;

type TypedGeneratorOptions =
  | (FilterGeneratorOptions<FullGeneratorOptions> & { generator?: 'full' })
  | (FilterGeneratorOptions<CachedGeneratorOptions> & { generator: 'cached' })
  | (FilterGeneratorOptions<RandomGeneratorOptions> & { generator: 'random' });

type SeamOptions = GeneralOptions & TypedGeneratorOptions;

type ProcessedSeamOptions = Required<GeneralOptions> & TypedGeneratorOptions;

export type RendererConfig = {
  parentNode: HTMLElement;
  src: string;
} & SeamOptions;

export class Renderer {
  #canvas!: HTMLCanvasElement;
  #ctx!: CanvasRenderingContext2D;
  #height: number = 0;
  #width: number = 0;
  #imageLoader: ImageLoader;
  #options: ProcessedSeamOptions;
  #generator: SeamGenerator;
  #redrawQueued = false;

  constructor(config: RendererConfig) {
    const { parentNode, src, ...options } = config;
    this.#options = this.#validateAndApplyDefaults(options);
    this.#imageLoader = new ImageLoader(src, {
      rotate: this.#options.scalingAxis === 'vertical',
    });
    this.#generator = this.#createGenerator();

    this.#initializeCanvas(parentNode);
  }

  destroy(): void {
    this.#canvas.remove();
  }

  #createGenerator(): SeamGenerator {
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

  #validateAndApplyDefaults(options: SeamOptions): ProcessedSeamOptions {
    const getConstrainedNumber = (
      name: ConditionalKeys<SeamOptions, number | undefined>,
      defaultValue: number,
      min: number = 0,
      max: number = 1
    ): number => {
      const value = options[name] ?? defaultValue;
      if (value < min || value > max) {
        throw new Error(`[Seams] \`${name}\` must be between ${min} and ${max}.`);
      }
      return value;
    };

    const newOptions: SeamOptions = {
      ...options,
      carvingPriority: getConstrainedNumber('carvingPriority', 1),
      maxCarveUpSeamPercentage: getConstrainedNumber('maxCarveUpSeamPercentage', 0.6),
      maxCarveUpScale: getConstrainedNumber('maxCarveUpScale', 10, 1, 10),
      maxCarveDownScale: getConstrainedNumber('maxCarveDownScale', 0.1),
      scalingAxis: options.scalingAxis ?? 'horizontal',
    };

    if (!newOptions.generator) {
      newOptions.generator = 'full';
    }

    return newOptions as ProcessedSeamOptions;
  }

  #initializeCanvas(parentNode: HTMLElement): void {
    const parentNodeSize = parentNode.getBoundingClientRect();
    this.#canvas = document.createElement('canvas');
    this.#ctx = this.#canvas.getContext('2d')!;
    this.#canvas.width = this.#width = parentNodeSize.width;
    this.#canvas.height = this.#height = parentNodeSize.height;

    parentNode.appendChild(this.#canvas);

    this.#queueRedraw();
  }

  setSize(width: number, height: number): this {
    this.#canvas.width = this.#width = width;
    this.#canvas.height = this.#height = height;
    this.#queueRedraw();

    return this;
  }

  setWidth(width: number): this {
    this.#canvas.width = this.#width = width;
    this.#queueRedraw();

    return this;
  }

  setHeight(height: number): this {
    this.#canvas.height = this.#height = height;
    this.#queueRedraw();

    return this;
  }

  setOptions(options: Partial<SeamOptions>): this {
    this.#options = this.#validateAndApplyDefaults({
      ...this.#options,
      ...options,
    } as SeamOptions);

    this.#queueRedraw();

    return this;
  }

  #queueRedraw(): void {
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
  #determineCarvingParameters(imageData: ImageData): {
    availableSeams: number;
    interpolationPixels: number;
  } {
    const { carvingPriority, maxCarveUpSeamPercentage, maxCarveUpScale, maxCarveDownScale } =
      this.#options;
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

    // if shrinking
    if (direction === 1) {
      return { availableSeams, interpolationPixels: 0 };
    } else {
      // Calculate totalPixelsToInsert based on the effective target width driven by aspect ratio and canvas dimensions,
      // capped by maxCarveUpScale.
      const targetEffectiveWidthByRatio = Math.round((originalHeight / this.#height) * this.#width);
      const targetPixelsNeeded = targetEffectiveWidthByRatio - originalWidth;

      const maxCarveUpImageDataWidth = Math.floor(originalWidth * maxCarveUpScale);
      const maxPixelsByScale = maxCarveUpImageDataWidth - originalWidth;

      // The total pixels to insert is the minimum of what's needed for the target ratio, and what's allowed by maxCarveUpScale.
      const totalPixelsToInsert = Math.max(0, Math.min(targetPixelsNeeded, maxPixelsByScale));

      const interpolationPixels = totalPixelsToInsert;

      return { availableSeams, interpolationPixels };
    }
  }

  async redraw(): Promise<this> {
    const originalImageLoader = this.#imageLoader;
    const originalImageData = await this.#imageLoader.imageData;

    // If the image loader was changed during the redraw, bail so that we don't accidentally race ourselves
    if (this.#imageLoader !== originalImageLoader) {
      return this;
    }

    const { availableSeams, interpolationPixels } =
      this.#determineCarvingParameters(originalImageData);

    let finalImageData: ImageData;

    if (availableSeams === 0) {
      finalImageData = originalImageData;
    } else {
      const seamGrid = await this.#generator.generateSeamGrid(Math.abs(availableSeams));
      if (availableSeams > 0) {
        finalImageData = this.#filterPixels(originalImageData, seamGrid, availableSeams);
      } else {
        finalImageData = this.#interpolatePixels(
          originalImageData,
          seamGrid,
          -availableSeams,
          interpolationPixels
        );
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

  #interpolatePixels(
    originalImageData: ImageData,
    seamGrid: SeamPixelPriorityGrid,
    seamsAvailable: number,
    totalPixelsToInsert: number
  ): ImageData {
    const { width: originalWidth, height, data: originalData } = originalImageData;
    const newWidth = originalWidth + totalPixelsToInsert;
    const newSize = newWidth * height * 4;
    const newData = new Uint8ClampedArray(newSize);
    let writeIndex = 0;
    const numPixels = originalData.length / 4;

    const basePixelsPerLocation = Math.floor(totalPixelsToInsert / seamsAvailable);
    const extraPixelsCount = totalPixelsToInsert % seamsAvailable;

    for (let readIndex = 0; readIndex < numPixels; readIndex++) {
      const priority = seamGrid[readIndex]!;
      const readIndexRgba = readIndex * 4;

      // If this pixel is a seam to be "inserted", add an interpolated pixel first.
      if (priority < seamsAvailable) {
        // Determine how many pixels to interpolate for *this specific seam*
        // To interlace the extra pixels, we distribute them based on a calculated pattern
        // rather than front-loading them to the lowest priority indices.
        const addExtraPixel =
          extraPixelsCount > 0 && (priority * extraPixelsCount) % seamsAvailable < extraPixelsCount;

        const pixelsToInterpolate = addExtraPixel
          ? basePixelsPerLocation + 1
          : basePixelsPerLocation;

        for (let i = 0; i < pixelsToInterpolate; i++) {
          const x = readIndex % originalWidth;
          if (x === 0) {
            // First column, just duplicate the pixel
            newData[writeIndex] = originalData[readIndexRgba]!;
            newData[writeIndex + 1] = originalData[readIndexRgba + 1]!;
            newData[writeIndex + 2] = originalData[readIndexRgba + 2]!;
            newData[writeIndex + 3] = originalData[readIndexRgba + 3]!;
          } else {
            // Interpolate with the pixel to the left
            const leftReadIndexRgba = (readIndex - 1) * 4;
            // Calculate interpolation factor for the current interpolated pixel
            const interpolationFactor = (i + 1) / (pixelsToInterpolate + 1);

            newData[writeIndex] = Math.round(
              originalData[leftReadIndexRgba]! +
                (originalData[readIndexRgba]! - originalData[leftReadIndexRgba]!) *
                  interpolationFactor
            );
            newData[writeIndex + 1] = Math.round(
              originalData[leftReadIndexRgba + 1]! +
                (originalData[readIndexRgba + 1]! - originalData[leftReadIndexRgba + 1]!) *
                  interpolationFactor
            );
            newData[writeIndex + 2] = Math.round(
              originalData[leftReadIndexRgba + 2]! +
                (originalData[readIndexRgba + 2]! - originalData[leftReadIndexRgba + 2]!) *
                  interpolationFactor
            );
            newData[writeIndex + 3] = Math.round(
              originalData[leftReadIndexRgba + 3]! +
                (originalData[readIndexRgba + 3]! - originalData[leftReadIndexRgba + 3]!) *
                  interpolationFactor
            );
          }
          writeIndex += 4;
        }
      }

      // Always write the original pixel
      newData[writeIndex] = originalData[readIndexRgba]!;
      newData[writeIndex + 1] = originalData[readIndexRgba + 1]!;
      newData[writeIndex + 2] = originalData[readIndexRgba + 2]!;
      newData[writeIndex + 3] = originalData[readIndexRgba + 3]!;
      writeIndex += 4;
    }

    if (writeIndex !== newSize) {
      console.error(
        `[Seams-1] Mismatch during interpolation. Wrote ${writeIndex} bytes but expected ${newSize}.`
      );
    }

    return new ImageData(newData, newWidth, height);
  }

  #filterPixels(
    originalImageData: ImageData,
    seamGrid: SeamPixelPriorityGrid,
    seamsToRemove: number
  ): ImageData {
    const { width: originalWidth, height, data: originalData } = originalImageData;
    const newWidth = originalWidth - seamsToRemove;
    const newSize = newWidth * height * 4;
    const newData = new Uint8ClampedArray(newSize);
    const numPixels = originalData.length / 4;
    let writeIndex = 0;

    for (let readIndex = 0; readIndex < numPixels; readIndex++) {
      const priority = seamGrid[readIndex]!;

      if (priority >= seamsToRemove) {
        const readIndexRgba = readIndex * 4;

        newData[writeIndex] = originalData[readIndexRgba]!;
        newData[writeIndex + 1] = originalData[readIndexRgba + 1]!;
        newData[writeIndex + 2] = originalData[readIndexRgba + 2]!;
        newData[writeIndex + 3] = originalData[readIndexRgba + 3]!;

        writeIndex += 4;
      }
    }

    if (writeIndex !== newSize) {
      console.error(
        `[Seams-2] Mismatch in pixel buffer size. Expected ${newSize}, but got ${writeIndex}.`
      );
    }

    return new ImageData(newData, newWidth, height);
  }
}
