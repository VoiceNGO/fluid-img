import { RandomGenerator, RandomGeneratorOptions } from '../random-generator/random-generator';
import {
  PredictiveGenerator,
  PredictiveGeneratorOptions,
} from '../predictive-generator/predictive-generator';
import { CachedGenerator, CachedGeneratorOptions } from '../cached-generator/cached-generator';
import { FullGenerator, FullGeneratorOptions } from '../full-generator/full-generator';
import { GeneratorType } from '../../utils/types/types';

export type Generator = RandomGenerator | PredictiveGenerator | CachedGenerator | FullGenerator;
export type GeneratorOptions =
  | RandomGeneratorOptions
  | PredictiveGeneratorOptions
  | CachedGeneratorOptions
  | FullGeneratorOptions;

export function createGenerator(type: GeneratorType, options: GeneratorOptions): Generator {
  switch (type) {
    case 'full':
      return new FullGenerator(options as FullGeneratorOptions);
    case 'cached':
      return new CachedGenerator(options as CachedGeneratorOptions);
    case 'predictive':
      return new PredictiveGenerator(options as PredictiveGeneratorOptions);
    case 'random':
    default:
      return new RandomGenerator(options as RandomGeneratorOptions);
  }
}
