import { ImageLoader } from '../../utils/image-loader/image-loader';
import { SeamGenerator, SeamPixelPriorityGrid } from '../../utils/seam-spec/seam-spec';
import { throwGeneratorClass } from '../../utils/throw-generator-class/throw-generator-class';

export type FullGeneratorOptions = {
  imageLoader: ImageLoader;
};

class FullGeneratorClass implements SeamGenerator {
  #imageLoader: ImageLoader;

  constructor(options: FullGeneratorOptions) {
    this.#imageLoader = options.imageLoader;
  }

  async generateSeamGrid(minSeams: number): Promise<SeamPixelPriorityGrid> {
    return new Uint16Array() as SeamPixelPriorityGrid;
  }
}

export const FullGenerator =
  typeof USE_FULL_GENERATOR === 'boolean' && USE_FULL_GENERATOR
    ? FullGeneratorClass
    : throwGeneratorClass('FullGenerator');
