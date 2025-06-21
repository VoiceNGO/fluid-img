import { SobelEnergyMap } from '../sobel-energy-map/sobel-energy-map';
import { DualEnergyMap } from '../dual-energy-map/dual-energy-map';
import { BoundaryAwareEnergyMap } from '../boundary-aware-energy-map/boundary-aware-energy-map';

// Energy map algorithm types
export type EnergyMapAlgorithm =
  | 'sobel'
  | 'dual'
  | 'boundary-aware'
  | 'scharr'
  | 'entropy'
  | 'laplacian'
  | 'saliency';

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
  scharr: {},
  entropy: {
    windowSize: 5,
  },
  laplacian: {
    sigma: 1.0,
  },
  saliency: {
    model: 'frequency-tuned' as const,
  },
} as const;

// Factory function to create energy maps
function createEnergyMap(algorithm: EnergyMapAlgorithm, imageData: ImageData) {
  switch (algorithm) {
    case 'sobel':
      return new SobelEnergyMap(imageData);

    case 'dual':
      return new DualEnergyMap(imageData, CONFIG.dual.forwardEnergyWeight);

    case 'boundary-aware':
      return new BoundaryAwareEnergyMap(
        imageData,
        CONFIG['boundary-aware'].boundaryPenaltyWeight,
        CONFIG['boundary-aware'].uniformityThreshold,
        CONFIG['boundary-aware'].edgeThreshold
      );

    case 'scharr':
      // TODO: Implement ScharrEnergyMap
      throw new Error('Scharr energy map not implemented yet');

    case 'entropy':
      // TODO: Implement EntropyEnergyMap
      throw new Error('Entropy energy map not implemented yet');

    case 'laplacian':
      // TODO: Implement LaplacianEnergyMap
      throw new Error('Laplacian energy map not implemented yet');

    case 'saliency':
      // TODO: Implement SaliencyEnergyMap
      throw new Error('Saliency energy map not implemented yet');

    default:
      const _exhaustive: never = algorithm;
      throw new Error(`Unknown energy map algorithm: ${algorithm}`);
  }
}

// Export the chosen implementation as "EnergyMap"
export const EnergyMap = class EnergyMap {
  private impl: SobelEnergyMap | DualEnergyMap | BoundaryAwareEnergyMap;

  constructor(imageData: ImageData) {
    this.impl = createEnergyMap(ENERGY_ALGORITHM, imageData);
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

// Export the original classes and factory for direct access
export { SobelEnergyMap, DualEnergyMap, BoundaryAwareEnergyMap, createEnergyMap };
