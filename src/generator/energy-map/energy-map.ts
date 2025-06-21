import { SobelEnergyMap } from '../sobel-energy-map/sobel-energy-map';
import { DualEnergyMap } from '../dual-energy-map/dual-energy-map';
import { BoundaryAwareEnergyMap } from '../boundary-aware-energy-map/boundary-aware-energy-map';
import { GrayscalePixelArray } from '../../utils/types/types';

// Energy map algorithm types
export type EnergyMapAlgorithm = 'sobel' | 'dual' | 'boundary-aware';

// Configuration: change this to switch energy map implementations
const ENERGY_ALGORITHM: EnergyMapAlgorithm = 'sobel';

// Algorithm-specific configuration
const CONFIG = {
  dual: {
    forwardEnergyWeight: 1.0,
  },
  'boundary-aware': {
    boundaryPenaltyWeight: 5.0,
    uniformityThreshold: 10.0,
    edgeThreshold: 20.0,
  },
  sobel: {},
} as const;

// Factory function to create energy maps
function createEnergyMap(
  algorithm: EnergyMapAlgorithm,
  imageData: ImageData,
  maskData?: GrayscalePixelArray
) {
  switch (algorithm) {
    case 'sobel':
      return new SobelEnergyMap(imageData, maskData);

    case 'dual':
      return new DualEnergyMap(imageData, CONFIG.dual.forwardEnergyWeight, maskData);

    case 'boundary-aware':
      return new BoundaryAwareEnergyMap(
        imageData,
        CONFIG['boundary-aware'].boundaryPenaltyWeight,
        CONFIG['boundary-aware'].uniformityThreshold,
        CONFIG['boundary-aware'].edgeThreshold,
        maskData
      );

    default:
      const _exhaustive: never = algorithm;
      throw new Error(`Unknown energy map algorithm: ${algorithm}`);
  }
}

// Export the chosen implementation as "EnergyMap"
export const EnergyMap = class EnergyMap {
  private impl: SobelEnergyMap | DualEnergyMap | BoundaryAwareEnergyMap;

  constructor(imageData: ImageData, maskData?: GrayscalePixelArray) {
    this.impl = createEnergyMap(ENERGY_ALGORITHM, imageData, maskData);
  }

  get width() {
    return this.impl.width;
  }
  get height() {
    return this.impl.height;
  }
  get energyMap() {
    return this.impl.energyMap;
  }
  get originalIndices() {
    return this.impl.originalIndices;
  }

  removeSeam(xIndices: Uint16Array) {
    return this.impl.removeSeam(xIndices);
  }
  removeSeams(seams: Uint16Array[]) {
    return this.impl.removeSeams(seams);
  }
  getEnergyMapAsImageData(width?: number, height?: number) {
    return this.impl.getEnergyMapAsImageData(width, height);
  }
};

export type EnergyMap = InstanceType<typeof EnergyMap>;

// Export the original classes and factory for direct access
export { SobelEnergyMap, DualEnergyMap, BoundaryAwareEnergyMap, createEnergyMap };
