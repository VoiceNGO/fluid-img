import type { Tagged } from 'type-fest';

declare global {
  const RANDOM_GENERATOR: boolean;
  const PREDICTIVE_GENERATOR: boolean;
  const DEMO: boolean;
  const SOBEL_ENERGY_MAP: boolean;
  const DUAL_ENERGY_MAP: boolean;
  const BOUNDARY_AWARE_ENERGY_MAP: boolean;
}

export const GENERATOR = {
  Random: 'random',
  Predictive: 'predictive',
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
