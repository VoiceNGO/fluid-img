import { getImageData } from '../../utils/get-image-data/get-image-data';
import type { SetRequired } from 'type-fest';

export interface SeamGenerator {
  generateSeamGrid(minSeams: number): Promise<SeamPixelPriorityGrid>;
}

type SeamPixelPriorityGrid = Uint16Array & {
  width: number;
  height: number;
};

type SeamOptions = {
  carvingPriority?: number;
  maxCarveUpRatio?: number;
  maxCarveDownRatio?: number;
  visibleSeamRemoval?: boolean;
  seamRemovalTimeMS?: number;
  seamRemovalOverlapMS?: number;
};

type ProcessedSeamOptions = SetRequired<
  SeamOptions,
  'carvingPriority' | 'maxCarveUpRatio' | 'maxCarveDownRatio'
>;

type RendererConfig = {
  parentNode: HTMLElement;
  imgSrc: string;
  generator: SeamGenerator;
} & SeamOptions;

export class Renderer {
  #canvas!: HTMLCanvasElement;
  #ctx!: CanvasRenderingContext2D;
  #height: number = 0;
  #width: number = 0;
  #image!: HTMLImageElement;
  #imgPromise: Promise<HTMLImageElement | null> = Promise.resolve(null);
  #imageDataPromise: Promise<ImageData | null> = Promise.resolve(null);
  #options: ProcessedSeamOptions;
  #generator: SeamGenerator;
  #redrawQueued = false;

  constructor(config: RendererConfig) {
    const { parentNode, imgSrc, generator, ...options } = config;
    this.#generator = generator;
    this.#options = this.#validateAndApplyDefaults(options);

    this.#initializeCanvas(parentNode);
    this.#loadImage(imgSrc);
  }

  #validateAndApplyDefaults(options: SeamOptions): ProcessedSeamOptions {
    const checkAndGet = (
      name: 'carvingPriority' | 'maxCarveUpRatio' | 'maxCarveDownRatio',
      defaultValue: number
    ): number => {
      const value = options[name] ?? defaultValue;
      if (value < 0 || value > 1) {
        throw new Error(`[Seams] \`${name}\` must be between 0 and 1.`);
      }
      return value;
    };

    return {
      ...options,
      carvingPriority: checkAndGet('carvingPriority', 1),
      maxCarveUpRatio: checkAndGet('maxCarveUpRatio', 0.5),
      maxCarveDownRatio: checkAndGet('maxCarveDownRatio', 0.5),
    };
  }

  #initializeCanvas(parentNode: HTMLElement): void {
    const parentNodeSize = parentNode.getBoundingClientRect();
    this.#canvas = document.createElement('canvas');
    this.#ctx = this.#canvas.getContext('2d')!;
    this.#canvas.width = this.#width = parentNodeSize.width;
    this.#canvas.height = this.#height = parentNodeSize.height;

    parentNode.appendChild(this.#canvas);
  }

  #loadImage(imgSrc: string): this {
    this.#imgPromise = new Promise(async (resolve) => {
      const img = new Image();
      img.onload = () => {
        this.#image = img;
        resolve(img);
      };
      img.src = imgSrc;
    });

    this.#imageDataPromise = this.#imgPromise.then((img) => {
      return getImageData(img!);
    });

    return this;
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

  setSrc(src: string): this {
    return this.#loadImage(src);
  }

  setOptions(options: SeamOptions): this {
    this.#options = this.#validateAndApplyDefaults({
      ...this.#options,
      ...options,
    });

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

  #calculateSeamDelta(): number {
    const { carvingPriority, maxCarveUpRatio, maxCarveDownRatio } = this.#options;
    const originalWidth = this.#image.width;
    const targetWidth = this.#width;

    const pixelDelta = originalWidth - targetWidth;
    if (pixelDelta === 0) return 0;

    const seamsToCalculate = Math.abs(pixelDelta) * carvingPriority;
    const maxRatio = pixelDelta > 0 ? maxCarveDownRatio : maxCarveUpRatio;
    const maxSeams = originalWidth * maxRatio;
    const direction = pixelDelta > 0 ? 1 : -1;

    return Math.floor(Math.min(seamsToCalculate, maxSeams)) * direction;
  }

  async redraw(): Promise<this> {
    const currentImagePromise = this.#imageDataPromise;
    const originalImageData = await currentImagePromise;

    if (
      // This guards against the race condition where the image data is updated during the redraw process.
      this.#imageDataPromise !== currentImagePromise ||
      !originalImageData ||
      !this.#image
    ) {
      return this;
    }

    const seamDelta = this.#calculateSeamDelta();

    let finalImageData: ImageData;

    if (seamDelta === 0) {
      finalImageData = originalImageData;
    } else {
      const seamGrid = await this.#generator.generateSeamGrid(Math.abs(seamDelta));
      finalImageData =
        seamDelta > 0
          ? this.#filterPixels(originalImageData, seamGrid, seamDelta)
          : this.#interpolatePixels(originalImageData, seamGrid, Math.abs(seamDelta));
    }

    this.#canvas.width = finalImageData.width;
    this.#canvas.height = finalImageData.height;
    this.#ctx.putImageData(finalImageData, 0, 0);

    this.#canvas.style.width = `${this.#width}px`;
    this.#canvas.style.height = `${this.#height}px`;

    return this;
  }

  #interpolatePixels(
    originalImageData: ImageData,
    seamGrid: SeamPixelPriorityGrid,
    seamsToAdd: number
  ): ImageData {
    const { width: originalWidth, height, data: originalData } = originalImageData;
    const newWidth = originalWidth + seamsToAdd;
    const newSize = newWidth * height * 4;
    const newData = new Uint8ClampedArray(newSize);
    let writeIndex = 0;
    const numPixels = originalData.length / 4;

    for (let readIndex = 0; readIndex < numPixels; readIndex++) {
      const priority = seamGrid[readIndex]!;
      const readIndexRgba = readIndex * 4;

      // If this pixel is a seam to be "inserted", add an interpolated pixel first.
      if (priority <= seamsToAdd) {
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
          newData[writeIndex] =
            (originalData[readIndexRgba]! + originalData[leftReadIndexRgba]!) / 2;
          newData[writeIndex + 1] =
            (originalData[readIndexRgba + 1]! + originalData[leftReadIndexRgba + 1]!) / 2;
          newData[writeIndex + 2] =
            (originalData[readIndexRgba + 2]! + originalData[leftReadIndexRgba + 2]!) / 2;
          newData[writeIndex + 3] =
            (originalData[readIndexRgba + 3]! + originalData[leftReadIndexRgba + 3]!) / 2;
        }
        writeIndex += 4;
      }

      // Always write the original pixel
      newData[writeIndex] = originalData[readIndexRgba]!;
      newData[writeIndex + 1] = originalData[readIndexRgba + 1]!;
      newData[writeIndex + 2] = originalData[readIndexRgba + 2]!;
      newData[writeIndex + 3] = originalData[readIndexRgba + 3]!;
      writeIndex += 4;
    }

    if (writeIndex !== newSize) {
      throw new Error(
        `[Seams] Mismatch during interpolation. Wrote ${writeIndex} bytes but expected ${newSize}.`
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

      if (priority > seamsToRemove) {
        const readIndexRgba = readIndex * 4;

        newData[writeIndex] = originalData[readIndexRgba]!;
        newData[writeIndex + 1] = originalData[readIndexRgba + 1]!;
        newData[writeIndex + 2] = originalData[readIndexRgba + 2]!;
        newData[writeIndex + 3] = originalData[readIndexRgba + 3]!;

        writeIndex += 4;
      }
    }

    if (writeIndex !== newSize) {
      throw new Error(
        `[Seams] Mismatch in pixel buffer size. Expected ${newSize}, but got ${writeIndex}.`
      );
    }

    return new ImageData(newData, newWidth, height);
  }
}
