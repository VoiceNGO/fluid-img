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

// Stored seam data
export type SeamData = {
  version: number;
  width: number;
  height: number;
  isVertical: boolean;
  stepSize: number;
  mergeSize: number;
};
