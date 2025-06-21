import { BaseGenerator, BaseGeneratorOptions } from '../base-generator/base-generator';
import { MinimalCumulativeEnergyMap } from '../minimal-cumulative-energy-map/minimal-cumulative-energy-map';

export type PredictiveGeneratorOptions = BaseGeneratorOptions & {
  batchPercentage?: number;
  minBatchSize?: number;
};

const defaultOptions: Required<PickOptional<PredictiveGeneratorOptions>> = {
  batchPercentage: 0.05,
  minBatchSize: 10,
};

export class PredictiveGenerator extends BaseGenerator {
  protected options: Required<PredictiveGeneratorOptions>;

  constructor(options: PredictiveGeneratorOptions) {
    super(options);
    this.options = { ...defaultOptions, ...options };
  }

  setBatchPercentage(percentage: number): void {
    this.options.batchPercentage = percentage;
  }

  async generateSeamBatch(): Promise<void> {
    const energyMap = await this.energyMapPromise;
    const originalIndices = energyMap.originalIndices;
    const currentWidth = energyMap.width;
    const currentHeight = energyMap.height;

    // Generate bottom-up minimal cumulative energy map
    const minimalCumulativeEnergyMap = new MinimalCumulativeEnergyMap({
      energyMap,
      accumulateUp: true,
    });
    const minimalEnergyMapData = minimalCumulativeEnergyMap.minimalEnergyMap;

    // Initialize seams with energies from first row
    type Seam = {
      path: Uint16Array;
      energy: number;
      topEnergies: number[]; // Track top 10 highest energy pixels
    };
    const seams: Seam[] = [];
    const energyMapData = energyMap.energyMap;
    const topEnergyCount = 10; // Track top 10 highest energies
    const energyPenaltyMultiplier = 50; // Multiply top energies by this for penalty

    // Helper function to add energy and track top energies
    const addEnergyWithTopTracking = (seam: Seam, pixelEnergy: number): void => {
      // Add to regular energy
      seam.energy += pixelEnergy;

      // Add to top energies list
      seam.topEnergies.push(pixelEnergy);

      // Keep only top N energies (sort descending and take first N)
      seam.topEnergies.sort((a, b) => b - a);
      if (seam.topEnergies.length > topEnergyCount) {
        seam.topEnergies.length = topEnergyCount;
      }
    };

    for (let x = 0; x < currentWidth; x++) {
      const initialEnergy = energyMapData[0]![x]!;
      seams.push({
        path: new Uint16Array(currentHeight),
        energy: initialEnergy,
        topEnergies: [initialEnergy],
      });
      seams[x]!.path[0] = x;
    }

    // Track which seam is at each position
    let currentSeamsAtIndex = seams;

    // Process each row after the first
    for (let y = 1; y < currentHeight; y++) {
      const nextSeamsAtIndex: Seam[] = [];

      for (let x = 0; x < currentWidth; x++) {
        const currentSeam = currentSeamsAtIndex[x]!;

        // Last column must go straight
        if (x === currentWidth - 1) {
          currentSeam.path[y] = x;
          addEnergyWithTopTracking(currentSeam, energyMapData[y]![x]!);
          nextSeamsAtIndex[x] = currentSeam;
          continue;
        }

        const nextSeam = currentSeamsAtIndex[x + 1]!;

        // Determine which seam has lower energy
        const currentSeamLower = currentSeam.energy < nextSeam.energy;

        // Check which path in minimal energy map has lower energy
        const currentPathLower = minimalEnergyMapData[y]![x]! < minimalEnergyMapData[y]![x + 1]!;

        // If lower seam aligns with lower path, go straight; otherwise swap
        if (currentSeamLower === currentPathLower) {
          // Go straight
          currentSeam.path[y] = x;
          addEnergyWithTopTracking(currentSeam, energyMapData[y]![x]!);
          nextSeamsAtIndex[x] = currentSeam;
        } else {
          // Swap
          currentSeam.path[y] = x + 1;
          addEnergyWithTopTracking(currentSeam, energyMapData[y]![x + 1]!);
          nextSeamsAtIndex[x + 1] = currentSeam;

          nextSeam.path[y] = x;
          addEnergyWithTopTracking(nextSeam, energyMapData[y]![x]!);
          nextSeamsAtIndex[x] = nextSeam;

          // Skip the next position since we processed both seams
          x++;
        }
      }

      currentSeamsAtIndex = nextSeamsAtIndex;
    }

    // Add penalty based on top energies
    for (const seam of seams) {
      const topEnergySum = seam.topEnergies.reduce((sum, energy) => sum + energy, 0);
      seam.energy += topEnergySum * energyPenaltyMultiplier;
    }

    // Sort seams by energy
    seams.sort((a, b) => a.energy - b.energy);

    const batchSize = Math.max(
      // the '>> 1 << 1' ensures that the batch size is even.
      (Math.ceil(currentWidth * this.options.batchPercentage) >> 1) << 1,
      Math.min(this.options.minBatchSize, currentWidth)
    );
    const batchSeams = seams.slice(0, batchSize);

    let seamIndex = this.generatedSeams;
    for (let i = 0; i < batchSeams.length; i++) {
      const seam = batchSeams[i]!;
      seam.path.forEach((x, y) => {
        const originalIndex = originalIndices[y]![x]!;
        if (this.seamGrid[originalIndex] !== 65535) {
          throw new Error('Seam overlap detected');
        }
        this.seamGrid[originalIndex] = seamIndex;
      });
      seamIndex++;
    }

    energyMap.removeSeams(batchSeams.map((seam) => seam.path));
    this.generatedSeams += batchSeams.length;
  }
}
