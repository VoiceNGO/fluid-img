import { RandomGenerator, RandomGeneratorOptions } from '../random-generator/random-generator';
import {
  PredictiveGenerator,
  PredictiveGeneratorOptions,
} from '../predictive-generator/predictive-generator';

export type GeneratorOptions =
  | ({ generator: 'random' } & RandomGeneratorOptions)
  | ({ generator: 'predictive' } & PredictiveGeneratorOptions);

function getGenerator(options: GeneratorOptions, specificType?: string) {
  if (
    (!specificType || specificType === 'random') &&
    typeof RANDOM_GENERATOR !== 'undefined' &&
    RANDOM_GENERATOR
  ) {
    return new RandomGenerator(options);
  }

  if (
    (!specificType || specificType === 'predictive') &&
    typeof PREDICTIVE_GENERATOR !== 'undefined' &&
    PREDICTIVE_GENERATOR
  ) {
    return new PredictiveGenerator(options);
  }

  return null;
}

export function createGenerator(options: GeneratorOptions) {
  const generator = getGenerator(options, options.generator) || getGenerator(options);

  if (!generator) {
    throw new Error(`[Fluid-Img] No generators are available.`);
  }

  return generator;
}
