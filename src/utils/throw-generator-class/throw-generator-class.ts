import { SeamGenerator, SeamPixelPriorityGrid } from '../seam-spec/seam-spec';

export function throwGeneratorClass(className: string) {
  return class ThrowGeneratorClass implements SeamGenerator {
    constructor() {
      throw new Error(`${className} is not implemented`);
    }

    generateSeamGrid(): Promise<SeamPixelPriorityGrid> {
      throw new Error(`${className} is not implemented`);
    }
  };
}
