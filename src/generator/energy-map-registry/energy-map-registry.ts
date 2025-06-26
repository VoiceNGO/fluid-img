import { BoundaryAwareEnergyMap } from '../boundary-aware-energy-map/boundary-aware-energy-map';
import { DualEnergyMap } from '../dual-energy-map/dual-energy-map';
import { SobelEnergyMap } from '../sobel-energy-map/sobel-energy-map';
import { GrayscalePixelArray } from '../../utils/types/types';
import { name as packageName } from '../../../package.json';

export type EnergyMapAlgorithm = 'sobel' | 'dual' | 'boundary-aware';
export type EnergyMapImpl = SobelEnergyMap | DualEnergyMap | BoundaryAwareEnergyMap;

//#region Options Types
type BaseEnergyMapOptions = {
  imageData: ImageData;
  maskData?: GrayscalePixelArray;
};

export type SobelEnergyMapOptions = BaseEnergyMapOptions & {
  algorithm?: 'sobel';
};

export type DualEnergyMapOptions = BaseEnergyMapOptions & {
  algorithm: 'dual';
  forwardEnergyWeight?: number;
};

export type BoundaryAwareEnergyMapOptions = BaseEnergyMapOptions & {
  algorithm: 'boundary-aware';
  boundaryPenaltyWeight?: number;
  uniformityThreshold?: number;
  edgeThreshold?: number;
};

export type EnergyMapOptions =
  | SobelEnergyMapOptions
  | DualEnergyMapOptions
  | BoundaryAwareEnergyMapOptions;

const energyMapRegistry = new Map<EnergyMapAlgorithm, new (options: any) => EnergyMapImpl>();

export function registerEnergyMap(
  algorithm: EnergyMapAlgorithm,
  constructor: new (options: any) => EnergyMapImpl
) {
  Promise.resolve().then(() => {
    energyMapRegistry.set(algorithm, constructor);
  });
}

export function createEnergyMap(options: EnergyMapOptions) {
  const algorithm = options.algorithm ?? 'sobel';
  const EnergyMapConstructor = energyMapRegistry.get(algorithm);

  if (!EnergyMapConstructor) {
    throw new Error(
      `[${packageName}] Energy map algorithm '${algorithm}' is not registered or included in the build.`
    );
  }

  return new EnergyMapConstructor(options);
}

// These will self-register
import '../sobel-energy-map/sobel-energy-map';
import '../dual-energy-map/dual-energy-map';
import '../boundary-aware-energy-map/boundary-aware-energy-map';
