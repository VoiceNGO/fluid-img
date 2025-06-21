import type { Tagged } from 'type-fest';

export type SeamDirection = 'horizontal' | 'vertical';
export type SeamDirectionWithBoth = SeamDirection | 'both';

export const HORIZONTAL: SeamDirection = 'horizontal';
export const VERTICAL: SeamDirection = 'vertical';
export const BOTH: SeamDirectionWithBoth = 'both';

// unparsed seam data
export type UnparsedSeamData = Tagged<Uint8Array, 'unparsedSeamData'>;

export type Seam = Tagged<Uint16Array, 'seam'>;
export type Seams = Tagged<Uint16Array[], 'seams'>;

export type SeamPixelPriorityGrid = Tagged<Uint16Array, 'seamGrid'>;

// Pixel energy
export type EnergyMap = Tagged<Uint16Array, 'EnergyMap'>;

// Stored seam data
export type SeamData = {
  version: number;
  width: number;
  height: number;
  isVertical: boolean;
  stepSize: number;
  mergeSize: number;
};

export type GeneratorType = 'random' | 'precise' | 'cached';

// export interface SeamGeneratorConstructor {
//   new (imageData: ImageData): SeamGenerator;
// }

export interface SeamGenerator {
  generateSeamGrid(minSeams: number): Promise<SeamPixelPriorityGrid>;
  generateSeamBatch(): Promise<void>;
}
