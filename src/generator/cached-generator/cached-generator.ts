import { ImageLoader } from '../../utils/image-loader/image-loader';
import { SeamGenerator, SeamPixelPriorityGrid } from '../../utils/seam-spec/seam-spec';
import { throwGeneratorClass } from '../../utils/throw-generator-class/throw-generator-class';

export type CachedGeneratorOptions = {
  imageLoader: ImageLoader;
  cacheSpecificOption: string;
};

class CachedGeneratorClass implements SeamGenerator {
  #imageLoader: ImageLoader;

  constructor(options: CachedGeneratorOptions) {
    this.#imageLoader = options.imageLoader;
  }

  async generateSeamGrid(minSeams: number): Promise<SeamPixelPriorityGrid> {
    return new Uint16Array() as SeamPixelPriorityGrid;
  }
}

export const CachedGenerator = USE_CACHED_GENERATOR
  ? CachedGeneratorClass
  : throwGeneratorClass('CachedGenerator');
