import type { Tagged } from 'type-fest';

export const GENERATOR = {
  Random: 'random',
  Predictive: 'predictive',
  Cached: 'cached',
  Full: 'full',
} as const;

export type EnumKeys<T> = T[keyof T];

export type PickOptional<T> = {
  [K in keyof T as {} extends Pick<T, K> ? K : never]: T[K];
};

export type SeamPixelPriorityGrid = Tagged<Uint16Array, 'seamGrid'>;
export type EnergyMap = Tagged<Uint16Array, 'EnergyMap'>;
export type GeneratorType = EnumKeys<typeof GENERATOR>;
export type GrayscalePixelArray = Tagged<Uint8Array, 'grayscalePixelArray'>;

export interface SeamGenerator {
  generateSeamGrid(minSeams: number): Promise<SeamPixelPriorityGrid>;
  generateSeamBatch(): Promise<void>;
}
