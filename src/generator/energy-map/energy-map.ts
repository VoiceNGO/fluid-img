import { GrayscalePixelArray } from '../../utils/types/types';
import {
  createEnergyMap,
  EnergyMapAlgorithm,
  EnergyMapImpl,
  EnergyMapOptions,
} from '../energy-map-registry/energy-map-registry';
import { BoundaryAwareEnergyMap } from '../boundary-aware-energy-map/boundary-aware-energy-map';
import { DualEnergyMap } from '../dual-energy-map/dual-energy-map';
import { SobelEnergyMap } from '../sobel-energy-map/sobel-energy-map';

export const EnergyMap = class EnergyMap {
  private impl: EnergyMapImpl;

  constructor(options: EnergyMapOptions) {
    this.impl = createEnergyMap(options);
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

export {
  SobelEnergyMap,
  DualEnergyMap,
  BoundaryAwareEnergyMap,
  createEnergyMap as createEnergyMapFactory,
};
export type { EnergyMapAlgorithm };
