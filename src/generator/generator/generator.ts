import { RandomGenerator, RandomGeneratorOptions } from '../random-generator/random-generator';
import {
  PredictiveGenerator,
  PredictiveGeneratorOptions,
} from '../predictive-generator/predictive-generator';
import { CachedGenerator, CachedGeneratorOptions } from '../cached-generator/cached-generator';
import { FullGenerator, FullGeneratorOptions } from '../full-generator/full-generator';

export type Generator = RandomGenerator | PredictiveGenerator | CachedGenerator | FullGenerator;
export type GeneratorOptions =
  | RandomGeneratorOptions
  | PredictiveGeneratorOptions
  | CachedGeneratorOptions
  | FullGeneratorOptions;

export const Generator =
  GENERATOR === 'full'
    ? FullGenerator
    : GENERATOR === 'cached'
      ? CachedGenerator
      : GENERATOR === 'predictive'
        ? PredictiveGenerator
        : RandomGenerator;
