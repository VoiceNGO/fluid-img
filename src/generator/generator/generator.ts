import { RandomGenerator, RandomGeneratorOptions } from '../random-generator/random-generator';
import {
  PredictiveGenerator,
  PredictiveGeneratorOptions,
} from '../predictive-generator/predictive-generator';
import { name as packageName } from '../../../package.json';

export type GeneratorType = 'random' | 'predictive';
export type GeneratorImpl = RandomGenerator | PredictiveGenerator;

export type GeneratorOptions =
  | ({ generator?: 'random' } & RandomGeneratorOptions)
  | ({ generator: 'predictive' } & PredictiveGeneratorOptions);

const generatorRegistry = new Map<GeneratorType, new (options: any) => GeneratorImpl>();

export function registerGenerator(
  algorithm: GeneratorType,
  constructor: new (options: any) => GeneratorImpl
) {
  Promise.resolve().then(() => {
    generatorRegistry.set(algorithm, constructor);
  });
}

export function createGenerator(options: GeneratorOptions) {
  const algorithm = options.generator ?? 'random';
  const GeneratorConstructor = generatorRegistry.get(algorithm);

  if (!GeneratorConstructor) {
    throw new Error(
      `[${packageName}] Generator '${algorithm}' is not registered or included in the build.`
    );
  }

  return new GeneratorConstructor(options);
}

// These will self-register
import '../random-generator/random-generator';
import '../predictive-generator/predictive-generator';
