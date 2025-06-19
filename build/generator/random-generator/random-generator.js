import { deterministicBinaryRnd } from '../../utils/deterministic-binary-rnd/deterministic-binary-rnd';
import { EnergyMap2D } from '../energy-map/energy-map';
import { throwGeneratorClass } from '../../utils/throw-generator-class/throw-generator-class';
const defaultOptions = {
    batchPercentage: 0.05,
    minBatchSize: 10,
};
class RandomGeneratorClass {
    #imageLoader;
    #energyMapPromise;
    #seamGrid = new Uint16Array();
    #connections = [];
    #generatedSeams = 0;
    #options;
    constructor(options) {
        this.#options = { ...defaultOptions, ...options };
        this.#imageLoader = options.imageLoader;
        this.#energyMapPromise = this.#createEnergyMap();
    }
    async #createEnergyMap() {
        const imageData = await this.#imageLoader.imageData;
        this.#seamGrid = new Uint16Array(imageData.width * imageData.height).fill(65535);
        return new EnergyMap2D(imageData);
    }
    setBatchPercentage(percentage) {
        this.#options.batchPercentage = percentage;
    }
    async #generateSeamBatch() {
        const energyMap = await this.#energyMapPromise;
        const originalIndices = energyMap.originalIndices;
        const currentWidth = energyMap.width;
        const currentHeight = energyMap.height;
        this.#generateRandomConnections(currentWidth, currentHeight);
        const seams = Array.from({ length: currentWidth }, (_, ix) => this.#getSeam(energyMap, ix));
        seams.sort((a, b) => a.energy - b.energy);
        const batchSize = Math.max(
        // the '>> 1 << 1' ensures that the batch size is even.
        (Math.ceil(currentWidth * this.#options.batchPercentage) >> 1) << 1, Math.min(this.#options.minBatchSize, currentWidth));
        const batchSeams = seams.slice(0, batchSize);
        let seamIndex = this.#generatedSeams;
        for (let i = 0; i < batchSeams.length; i++) {
            const seam = batchSeams[i];
            seam.seam.forEach((x, y) => {
                const originalIndex = originalIndices[y][x];
                if (this.#seamGrid[originalIndex] !== 65535) {
                    throw new Error('Seam overlap detected');
                }
                this.#seamGrid[originalIndex] = seamIndex;
            });
            seamIndex++;
        }
        energyMap.removeSeams(batchSeams.map((seam) => seam.seam));
        this.#generatedSeams += batchSeams.length;
    }
    #generateRandomConnections(width, height) {
        const rndGenerator = deterministicBinaryRnd(width * height + 1);
        this.#connections = Array.from({ length: height }, () => new Int8Array(width));
        const lastRowIx = width - 1;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (x === lastRowIx || rndGenerator(y * width + x)) {
                    this.#connections[y][x] = 0;
                }
                else {
                    this.#connections[y][x] = 1;
                    this.#connections[y][x + 1] = -1;
                    x++;
                }
            }
        }
    }
    #getSeam(energyMap, ix) {
        const height = energyMap.height;
        const seam = new Uint16Array(height);
        const energyMapData = energyMap.energyMap;
        let energy = 0;
        let lastX = ix;
        // this is critically broken and only ever generates seams that move 1px
        for (let y = 0; y < height; y++) {
            seam[y] = lastX = lastX + this.#connections[y][lastX];
            energy += energyMapData[y][lastX];
        }
        return { seam, energy };
    }
    async generateSeamGrid(minSeams) {
        const { width } = await this.#imageLoader.image;
        if (width < minSeams) {
            throw new Error(`Cannot generate ${minSeams} seams for image with width ${width}`);
        }
        while (this.#generatedSeams < minSeams) {
            await this.#generateSeamBatch();
        }
        return this.#seamGrid;
    }
}
export const RandomGenerator = USE_RANDOM_GENERATOR
    ? RandomGeneratorClass
    : throwGeneratorClass('RandomGenerator');
