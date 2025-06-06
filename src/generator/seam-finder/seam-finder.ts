import { EnergyMap2D } from '../energy-map/energy-map';
import { deleteArrayIndices } from '../../utils/delete-array-indicies/delete-array-indicies';

/**
 * Represents a seam as an array of x-coordinates, one for each row.
 */
export type Seam = Uint16Array;

export class SeamFinder {
  #energyMap: EnergyMap2D;
  #width: number;
  #height: number;
  #midPointRow1: number;

  #cumulativeEnergyTopDown!: Uint32Array[];
  #parentPointersTopDown!: Int8Array[];
  #cumulativeEnergyBottomUp!: Uint32Array[];
  #parentPointersBottomUp!: Int8Array[];
  #lastFoundSeam: Seam | null = null;

  constructor(imageDataRaw: Uint8ClampedArray, width: number, height: number) {
    this.#width = width;
    this.#height = height;
    const imgData = { data: imageDataRaw, width, height, colorSpace: 'srgb' as const };
    this.#energyMap = new EnergyMap2D(imgData);

    this.#midPointRow1 = Math.floor((this.#height - 1) / 2);
    this.#initializeDPArrays();
  }

  #initializeDPArrays(): void {
    this.#cumulativeEnergyTopDown = new Array(this.#midPointRow1 + 1);
    this.#parentPointersTopDown = new Array(this.#midPointRow1 + 1);
    for (let y = 0; y <= this.#midPointRow1; y++) {
      this.#cumulativeEnergyTopDown[y] = new Uint32Array(this.#width);
      this.#parentPointersTopDown[y] = new Int8Array(this.#width);
    }

    const localMidPointRow2 = this.#midPointRow1 + 1;
    const bottomUpArraySize = this.#height - localMidPointRow2;
    if (bottomUpArraySize > 0) {
      this.#cumulativeEnergyBottomUp = new Array(bottomUpArraySize);
      this.#parentPointersBottomUp = new Array(bottomUpArraySize);
      for (let i = 0; i < bottomUpArraySize; i++) {
        this.#cumulativeEnergyBottomUp[i] = new Uint32Array(this.#width);
        this.#parentPointersBottomUp[i] = new Int8Array(this.#width);
      }
    }
  }

  public findVerticalSeam(): Seam {
    this.#calculateTopDownDP();
    const localMidPointRow2 = this.#midPointRow1 + 1;
    if (localMidPointRow2 < this.#height) {
      this.#calculateBottomUpDP();
    }
    return this.#findAndTraceSeam();
  }

  #getEnergy(y: number, x: number): number {
    return this.#energyMap.data[y]![x]!;
  }

  #fillDPTable(
    dpTable: Uint32Array[],
    parentPointerTable: Int8Array[],
    imageLoopStartRow: number,
    imageLoopEndRowInclusive: number,
    yStep: 1 | -1,
    dpTableIndexOffset: number
  ): void {
    for (
      let currentImageY = imageLoopStartRow;
      yStep === 1
        ? currentImageY <= imageLoopEndRowInclusive
        : currentImageY >= imageLoopEndRowInclusive;
      currentImageY += yStep
    ) {
      const dpRow = currentImageY - dpTableIndexOffset;
      const prevNextDpRow = currentImageY - yStep - dpTableIndexOffset;

      for (let x = 0; x < this.#width; x++) {
        let minPriorEnergy = dpTable[prevNextDpRow]![x]!;
        let parentOffset = 0;

        if (x > 0) {
          const energyLeft = dpTable[prevNextDpRow]![x - 1]!;
          if (energyLeft < minPriorEnergy) {
            minPriorEnergy = energyLeft;
            parentOffset = -1;
          }
        }

        if (x < this.#width - 1) {
          const energyRight = dpTable[prevNextDpRow]![x + 1]!;
          if (energyRight < minPriorEnergy) {
            minPriorEnergy = energyRight;
            parentOffset = 1;
          }
        }
        dpTable[dpRow]![x] = this.#getEnergy(currentImageY, x) + minPriorEnergy;
        parentPointerTable[dpRow]![x] = parentOffset;
      }
    }
  }

  #calculateTopDownDP(): void {
    for (let x = 0; x < this.#width; x++) {
      this.#cumulativeEnergyTopDown[0]![x] = this.#getEnergy(0, x);
      this.#parentPointersTopDown[0]![x] = 0;
    }
    if (this.#midPointRow1 >= 1) {
      this.#fillDPTable(
        this.#cumulativeEnergyTopDown,
        this.#parentPointersTopDown,
        1,
        this.#midPointRow1,
        1,
        0
      );
    }
  }

  #calculateBottomUpDP(): void {
    const localMidPointRow2 = this.#midPointRow1 + 1;

    const lastImageRow = this.#height - 1;
    const lastBottomUpIndex = lastImageRow - localMidPointRow2;

    for (let x = 0; x < this.#width; x++) {
      this.#cumulativeEnergyBottomUp[lastBottomUpIndex]![x] = this.#getEnergy(lastImageRow, x);
      this.#parentPointersBottomUp[lastBottomUpIndex]![x] = 0;
    }

    if (lastImageRow - 1 >= localMidPointRow2) {
      this.#fillDPTable(
        this.#cumulativeEnergyBottomUp,
        this.#parentPointersBottomUp,
        lastImageRow - 1,
        localMidPointRow2,
        -1,
        localMidPointRow2
      );
    }
  }

  #findAndTraceSeam(): Seam {
    let minTotalEnergy = Infinity;
    let bestXMidTop = 0;
    let bestXMidBottom = 0;
    const localMidPointRow2 = this.#midPointRow1 + 1;

    const E_td_row = this.#cumulativeEnergyTopDown[this.#midPointRow1]!;
    const E_bu_row = this.#cumulativeEnergyBottomUp[0]!;

    for (let x1 = 0; x1 < this.#width; x1++) {
      const energy1_td = E_td_row[x1]!;

      let currentMinEbuForX1 = E_bu_row[x1]!;
      let currentBestX2ForX1 = x1;

      if (x1 > 0 && E_bu_row[x1 - 1]! < currentMinEbuForX1) {
        currentMinEbuForX1 = E_bu_row[x1 - 1]!;
        currentBestX2ForX1 = x1 - 1;
      }

      if (x1 < this.#width - 1 && E_bu_row[x1 + 1]! < currentMinEbuForX1) {
        currentMinEbuForX1 = E_bu_row[x1 + 1]!;
        currentBestX2ForX1 = x1 + 1;
      }

      const currentTotalSum = energy1_td + currentMinEbuForX1;
      if (currentTotalSum < minTotalEnergy) {
        minTotalEnergy = currentTotalSum;
        bestXMidTop = x1;
        bestXMidBottom = currentBestX2ForX1;
      }
    }

    const seamCoordinates = new Uint16Array(this.#height);

    seamCoordinates[this.#midPointRow1] = bestXMidTop;
    seamCoordinates[localMidPointRow2] = bestXMidBottom;

    let currentX = bestXMidTop;
    for (let y = this.#midPointRow1 - 1; y >= 0; y--) {
      const parentOffset = this.#parentPointersTopDown[y + 1]![currentX]!;
      currentX += parentOffset;
      seamCoordinates[y] = currentX;
    }

    if (localMidPointRow2 < this.#height - 1) {
      currentX = bestXMidBottom;
      for (let imgY = localMidPointRow2 + 1; imgY < this.#height; imgY++) {
        const parentDpRowIndex = imgY - 1 - localMidPointRow2;
        const childOffset = this.#parentPointersBottomUp[parentDpRowIndex]![currentX]!;
        currentX += childOffset;
        seamCoordinates[imgY] = currentX;
      }
    }
    return seamCoordinates;
  }
}
