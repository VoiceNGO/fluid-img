import { ImageLoader } from '../../utils/image-loader/image-loader';
import { BaseGenerator, BaseGeneratorOptions } from '../base-generator/base-generator';

export type FullGeneratorOptions = BaseGeneratorOptions;

export class FullGenerator extends BaseGenerator {
  constructor(options: FullGeneratorOptions) {
    super(options);
  }

  async generateSeamBatch(): Promise<void> {
    // Shell implementation
    // This would be where the full generator implementation goes
  }
}
