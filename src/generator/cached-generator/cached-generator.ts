import { ImageLoader } from '../../utils/image-loader/image-loader';
import { BaseGenerator, BaseGeneratorOptions } from '../base-generator/base-generator';

export type CachedGeneratorOptions = BaseGeneratorOptions & {
  cacheSpecificOption?: string;
};

const defaultOptions: Required<PickOptional<CachedGeneratorOptions>> = {
  cacheSpecificOption: '',
};

export class CachedGenerator extends BaseGenerator {
  protected options: Required<CachedGeneratorOptions>;

  constructor(options: CachedGeneratorOptions) {
    super(options);
    this.options = { ...defaultOptions, ...options };
  }

  async generateSeamBatch(): Promise<void> {
    // Shell implementation
    // This would be where the cached generator implementation goes
  }
}
