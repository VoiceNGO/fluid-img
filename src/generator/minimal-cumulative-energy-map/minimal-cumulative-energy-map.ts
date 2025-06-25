import { EnergyMap } from '../energy-map/energy-map';
import { deleteArrayIndices } from '../../utils/delete-array-indicies/delete-array-indicies';
import { PickOptional } from '../../utils/types/types';

export type CumulativeEnergyMapOptions = {
  energyMap: EnergyMap;
  constrainTo16Bit?: boolean;
  constrainToDiagonals?: boolean;
  accumulateUp?: boolean;
};
type RequiredCumulativeEnergyMapOptions = Required<CumulativeEnergyMapOptions>;

const cumulativeEnergyMapDefaultOptions: Required<PickOptional<CumulativeEnergyMapOptions>> = {
  constrainTo16Bit: false,
  constrainToDiagonals: false,
  accumulateUp: false,
};

export class MinimalCumulativeEnergyMap {
  #options: RequiredCumulativeEnergyMapOptions;
  #minimalEnergyMap: Uint16Array[] | Uint32Array[];
  #width: number;
  #height: number;

  constructor(options: CumulativeEnergyMapOptions) {
    this.#options = {
      ...cumulativeEnergyMapDefaultOptions,
      ...options,
    };

    this.#width = options.energyMap.width;
    this.#height = options.energyMap.height;
    this.#minimalEnergyMap = this.computeMinimalEnergyMap();
  }

  private computeMinimalEnergyMap(): Uint16Array[] | Uint32Array[] {
    const { energyMap, constrainTo16Bit, constrainToDiagonals, accumulateUp } = this.#options;

    const { width, height } = energyMap;
    const minimalEnergyMap = new Array(height);
    const startingRow = accumulateUp ? height - 1 : 0;
    const endingRow = accumulateUp ? -1 : height;
    const increment = accumulateUp ? -1 : 1;
    const divisor = constrainTo16Bit ? height / 256 : 1;
    const shiftAmount = constrainTo16Bit ? Math.ceil(Math.log2(divisor)) : 0;
    const energyMapData = energyMap.energyMap;

    // Just copy the first row
    minimalEnergyMap[startingRow] = new (constrainTo16Bit ? Uint16Array : Uint32Array)(
      energyMapData[startingRow]!
    );

    for (let row = startingRow + increment; row !== endingRow; row += increment) {
      minimalEnergyMap[row] = new (constrainTo16Bit ? Uint16Array : Uint32Array)(width);

      for (let col = 0; col < width; col++) {
        const energy = energyMapData[row]![col]!;

        const prevLeftEnergy = minimalEnergyMap[row - increment][col - 1] ?? Infinity;
        const prevRightEnergy = minimalEnergyMap[row - increment][col + 1] ?? Infinity;
        const prevStraightEnergy = constrainToDiagonals
          ? Infinity
          : minimalEnergyMap[row - increment][col];

        const minEnergy = Math.min(prevLeftEnergy, prevRightEnergy, prevStraightEnergy);

        // minimalEnergyMap[row]![col] = (energy + minEnergy) / divisor;
        minimalEnergyMap[row]![col] = (energy + minEnergy) >> shiftAmount;
      }
    }

    return minimalEnergyMap;
  }

  removeSeams(seams: Uint16Array[]): void {
    if (seams.length === 0) {
      return;
    }

    for (let y = 0; y < this.#height; y++) {
      const indicesToRemoveForRow: number[] = seams
        .map((seamPath) => seamPath[y]!)
        .sort((a, b) => a - b);

      this.#minimalEnergyMap[y] = deleteArrayIndices(
        this.#minimalEnergyMap[y]!,
        indicesToRemoveForRow
      );
    }

    this.#width -= seams.length;
  }

  get minimalEnergyMap(): Uint16Array[] | Uint32Array[] {
    return this.#minimalEnergyMap;
  }
}
