import { ImageLoader } from '../../utils/image-loader/image-loader';
import { GeneratorType, SeamPixelPriorityGrid } from '../../utils/types/types';
import { createGenerator, GeneratorOptions } from '../../generator/generator/generator';
import { Profiler } from '../../utils/profiler/profiler';
import { errorBoundary } from '../../utils/error-boundary/error-boundary';
import { EnergyMap } from '../../generator/energy-map/energy-map';
import { createOptionGetters } from '../../utils/option-helpers/option-helpers';
import { ScalingAxis } from '../../utils/enums/enums';

import { name as packageName } from '../../../package.json';

export interface SeamGenerator {
  generateSeamGrid(minSeams: number): Promise<SeamPixelPriorityGrid>;
}

type GeneralOptions = {
  generator?: GeneratorType;
  carvingPriority?: number;
  maxCarveUpSeamPercentage?: number;
  maxCarveUpScale?: number;
  maxCarveDownScale?: number;
  scalingAxis?: ScalingAxis;
  width?: number;
  height?: number;
  logger?: (message: string) => void;
  showEnergyMap?: boolean;
  demoMode?: boolean;
};

type SeamOptions = GeneralOptions & GeneratorOptions;
type ProcessedSeamOptions = Required<GeneralOptions> & GeneratorOptions;

export type RendererConfig = {
  parentNode: HTMLElement;
  src: string;
  generator?: GeneratorType;
  mask?: string;
} & SeamOptions;

export class Renderer {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private height = 0;
  private width = 0;
  private imageLoader!: ImageLoader;
  private maskLoader?: ImageLoader;
  private options!: ProcessedSeamOptions;
  private generator!: SeamGenerator;
  private redrawQueued = false;
  private profiler!: Profiler;
  private hasFailed = false;
  private parentNode: HTMLElement;
  private src: string;
  private mask?: string;
  private cachedEnergyMapImageData: ImageData | null = null;

  setOptions = errorBoundary(this._setOptions).bind(this);
  private redraw = errorBoundary(this._redraw).bind(this);

  constructor(config: RendererConfig) {
    const { parentNode, src, mask, ...options } = config;
    this.parentNode = parentNode;
    this.src = src;
    this.mask = mask;

    try {
      this.options = this.validateAndApplyDefaults(options);
      const rotate = this.options.scalingAxis === 'vertical';
      this.profiler = new Profiler(this.options.logger);
      this.imageLoader = new ImageLoader(src, { rotate, profiler: this.profiler });

      if (this.mask) {
        this.maskLoader = new ImageLoader(this.mask, { rotate });
      }

      this.generator = this.createGenerator();

      this.initializeCanvas(parentNode);
    } catch (e) {
      this.handleFailure(e);
    }
  }

  destroy(): void {
    this.canvas.remove();
  }

  private createGenerator(): SeamGenerator {
    const options = {
      ...this.options,
      imageLoader: this.imageLoader,
      maskLoader: this.maskLoader,
    };

    return createGenerator(options);
  }

  private validateAndApplyDefaults(options: SeamOptions): ProcessedSeamOptions {
    const { getBoolean, getConstrainedNumber, getEnumValue } = createOptionGetters(options);

    const newOptions: SeamOptions = {
      ...options,
      carvingPriority: getConstrainedNumber('carvingPriority', 1),
      maxCarveUpSeamPercentage: getConstrainedNumber('maxCarveUpSeamPercentage', 0.6),
      maxCarveUpScale: getConstrainedNumber('maxCarveUpScale', 10, 1, 10),
      maxCarveDownScale: getConstrainedNumber('maxCarveDownScale', 1),
      scalingAxis: getEnumValue('scalingAxis', ScalingAxis, ScalingAxis.Horizontal),
      logger: options.logger ?? (() => {}),
      showEnergyMap: getBoolean('showEnergyMap', false),
      demoMode: getBoolean('demoMode', false),
    };

    return newOptions as ProcessedSeamOptions;
  }

  private calculateDimensions(parentNode: HTMLElement): { width: number; height: number } {
    let { width, height } = this.options;
    if (width === undefined || height === undefined) {
      const parentNodeSize = parentNode.getBoundingClientRect();
      width = width ?? parentNodeSize.width;
      height = height ?? parentNodeSize.height;
    }

    return { width, height };
  }

  private initializeCanvas(parentNode: HTMLElement): void {
    const { width, height } = this.calculateDimensions(parentNode);

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = this.width = width;
    this.canvas.height = this.height = height;
    this.canvas.style.display = 'block';

    parentNode.appendChild(this.canvas);

    this.queueRedraw();
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.queueRedraw();
  }

  setWidth(width: number): void {
    this.width = width;
    this.queueRedraw();
  }

  setHeight(height: number): void {
    this.height = height;
    this.queueRedraw();
  }

  private _setOptions(options: Partial<SeamOptions>): void {
    const oldShowEnergyMap = this.options.showEnergyMap;

    this.options = this.validateAndApplyDefaults({
      ...this.options,
      ...options,
    } as SeamOptions);

    // Invalidate energy map cache if showEnergyMap option changed
    if (this.options.showEnergyMap !== oldShowEnergyMap) {
      this.cachedEnergyMapImageData = null;
    }

    this.queueRedraw();
  }

  private queueRedraw(): void {
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
  private determineCarvingParameters(imageData: ImageData): {
    availableSeams: number;
    interpolationPixels: number;
    carveDown: boolean;
  } {
    const { carvingPriority, maxCarveUpSeamPercentage, maxCarveUpScale, maxCarveDownScale } =
      this.options;
    const { width: originalWidth, height: originalHeight } = imageData;

    const isVertical = this.options.scalingAxis === 'vertical';
    const logicalCanvasWidth = isVertical ? this.height : this.width;
    const logicalCanvasHeight = isVertical ? this.width : this.height;

    const targetAspectRatio = logicalCanvasWidth / logicalCanvasHeight;
    const targetWidth = Math.round(originalHeight * targetAspectRatio);
    const pixelDelta = originalWidth - targetWidth;

    //
    if (pixelDelta === 0) {
      return { availableSeams: 0, interpolationPixels: 0, carveDown: false };
    }

    const seamsToCalculate = Math.abs(pixelDelta) * carvingPriority;
    const maxRatio = pixelDelta > 0 ? maxCarveDownScale : maxCarveUpSeamPercentage;
    const maxSeams = originalWidth * maxRatio;
    const direction = pixelDelta > 0 ? 1 : -1;
    const carveDown = pixelDelta > 0;

    const availableSeams = Math.floor(Math.min(seamsToCalculate, maxSeams)) * direction;

    // if shrinking
    if (carveDown) {
      return { availableSeams, interpolationPixels: 0, carveDown };
    } else {
      // Calculate totalPixelsToInsert based on the effective target width driven by aspect ratio and canvas dimensions,
      // capped by maxCarveUpScale.
      const targetEffectiveWidthByRatio = Math.round(
        (originalHeight / logicalCanvasHeight) * logicalCanvasWidth
      );
      const targetPixelsNeeded = targetEffectiveWidthByRatio - originalWidth;

      const maxCarveUpImageDataWidth = Math.floor(originalWidth * maxCarveUpScale);
      const maxPixelsByScale = maxCarveUpImageDataWidth - originalWidth;

      // The total pixels to insert is the minimum of what's needed for the target ratio, and what's allowed by maxCarveUpScale.
      const totalPixelsToInsert = Math.max(0, Math.min(targetPixelsNeeded, maxPixelsByScale));

      const interpolationPixels = totalPixelsToInsert;

      return { availableSeams: -availableSeams, interpolationPixels, carveDown };
    }
  }

  private async getEnergyMapImageData(): Promise<ImageData> {
    if (this.cachedEnergyMapImageData) {
      return this.cachedEnergyMapImageData;
    }

    const originalImageData = await this.imageLoader.imageData;
    const energyMap = new EnergyMap({ imageData: originalImageData });
    this.cachedEnergyMapImageData = energyMap.getEnergyMapAsImageData();

    return this.cachedEnergyMapImageData;
  }

  private async getSourceImageData(): Promise<ImageData> {
    if (this.options.showEnergyMap) {
      return await this.getEnergyMapImageData();
    } else {
      return await this.imageLoader.imageData;
    }
  }

  private async _redraw(): Promise<void> {
    if (!this.width || !this.height) return;

    this.profiler.start('redraw');
    const originalImageData = await this.getSourceImageData();

    const { availableSeams, interpolationPixels, carveDown } =
      this.determineCarvingParameters(originalImageData);

    let finalImageData: ImageData;

    if (availableSeams === 0) {
      finalImageData = originalImageData;
    } else {
      this.profiler.start('generateSeamGrid', 1);
      const seamGrid = await this.generator.generateSeamGrid(availableSeams);
      this.profiler.end('generateSeamGrid');

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
    const isVertical = this.options.scalingAxis === 'vertical';

    styleRef.transformOrigin = '0 0';
    styleRef.transform = isVertical ? 'rotate(-90deg) translateX(-100%)' : '';

    styleRef.width = `${isVertical ? this.height : this.width}px`;
    styleRef.height = `${isVertical ? this.width : this.height}px`;

    this.profiler.end('redraw');
  }

  private interpolatePixels(
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

    let x = 0;
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

        if (x === 0) {
          // First column, just duplicate the pixel
          for (let i = 0; i < pixelsToInterpolate; i++) {
            newData[writeIndex] = originalData[readIndexRgba]!;
            newData[writeIndex + 1] = originalData[readIndexRgba + 1]!;
            newData[writeIndex + 2] = originalData[readIndexRgba + 2]!;
            newData[writeIndex + 3] = originalData[readIndexRgba + 3]!;
            writeIndex += 4;
          }
        } else {
          // Interpolate with the pixel to the left
          const leftReadIndexRgba = (readIndex - 1) * 4;

          const r0 = originalData[leftReadIndexRgba]!;
          const g0 = originalData[leftReadIndexRgba + 1]!;
          const b0 = originalData[leftReadIndexRgba + 2]!;
          const a0 = originalData[leftReadIndexRgba + 3]!;

          const dr = originalData[readIndexRgba]! - r0;
          const dg = originalData[readIndexRgba + 1]! - g0;
          const db = originalData[readIndexRgba + 2]! - b0;
          const da = originalData[readIndexRgba + 3]! - a0;

          const denominator = pixelsToInterpolate + 1;
          for (let i = 0; i < pixelsToInterpolate; i++) {
            // Calculate interpolation factor for the current interpolated pixel
            const interpolationFactor = (i + 1) / denominator;

            newData[writeIndex] = Math.round(r0 + dr * interpolationFactor);
            newData[writeIndex + 1] = Math.round(g0 + dg * interpolationFactor);
            newData[writeIndex + 2] = Math.round(b0 + db * interpolationFactor);
            newData[writeIndex + 3] = Math.round(a0 + da * interpolationFactor);
            writeIndex += 4;
          }
        }
      }

      // Always write the original pixel
      newData[writeIndex] = originalData[readIndexRgba]!;
      newData[writeIndex + 1] = originalData[readIndexRgba + 1]!;
      newData[writeIndex + 2] = originalData[readIndexRgba + 2]!;
      newData[writeIndex + 3] = originalData[readIndexRgba + 3]!;
      writeIndex += 4;

      if (++x === originalWidth) {
        x = 0;
      }
    }

    if (writeIndex !== newSize) {
      console.error(
        `[${packageName}] Mismatch during interpolation. Wrote ${writeIndex} bytes but expected ${newSize}.`
      );
    }

    return new ImageData(newData, newWidth, height);
  }

  private filterPixels(
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
        `[${packageName}] Mismatch in pixel buffer size. Expected ${newSize}, but got ${writeIndex}.`
      );
    }

    return new ImageData(newData, newWidth, height);
  }

  private handleFailure(error: unknown): void {
    if (this.hasFailed) return;

    this.hasFailed = true;

    console.error(`[${packageName}] A critical error occurred. Falling back to <img>.`, error);

    this.canvas?.remove();

    const img = document.createElement('img');

    img.src = this.src;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.display = 'block';

    this.parentNode.appendChild(img);
  }
}
