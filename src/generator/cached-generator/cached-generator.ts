import { BaseGenerator, BaseGeneratorOptions } from '../base-generator/base-generator';

type CachedSpecificOptions = {
  cacheSpecificOption?: string;
};

export type CachedGeneratorOptions = BaseGeneratorOptions & CachedSpecificOptions;

type CachedInstanceOptions = BaseGeneratorOptions & Required<CachedSpecificOptions>;

const defaultOptions: Required<CachedSpecificOptions> = {
  cacheSpecificOption: '',
};

export class CachedGenerator extends BaseGenerator {
  protected options: CachedInstanceOptions;

  constructor(options: CachedGeneratorOptions) {
    super(options);
    this.options = { ...defaultOptions, ...options };
  }

  async generateSeamBatch(): Promise<void> {
    // Shell implementation
    // This would be where the cached generator implementation goes
  }
}
