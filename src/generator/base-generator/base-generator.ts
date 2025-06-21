import { EnergyMap } from '../energy-map/energy-map';
import { SeamGenerator, SeamPixelPriorityGrid } from '../../utils/seam-spec/seam-spec';
import { ImageLoader } from '../../utils/image-loader/image-loader';

export type BaseGeneratorOptions = {
  imageLoader: ImageLoader;
};

export abstract class BaseGenerator implements SeamGenerator {
  protected imageLoader: ImageLoader;
  protected energyMapPromise: Promise<EnergyMap>;
  protected seamGrid: SeamPixelPriorityGrid = new Uint16Array() as SeamPixelPriorityGrid;
  protected generatedSeams = 0;

  constructor(options: BaseGeneratorOptions) {
    this.imageLoader = options.imageLoader;
    this.energyMapPromise = this.createEnergyMap();
  }

  protected async createEnergyMap(): Promise<EnergyMap> {
    const imageData = await this.imageLoader.imageData;

    this.seamGrid = new Uint16Array(imageData.width * imageData.height).fill(
      65535
    ) as SeamPixelPriorityGrid;

    return new EnergyMap(imageData);
  }

  abstract generateSeamBatch(): Promise<void>;

  async generateSeamGrid(minSeams: number): Promise<SeamPixelPriorityGrid> {
    const { width } = await this.imageLoader.image;

    if (width < minSeams) {
      throw new Error(`Cannot generate ${minSeams} seams for image with width ${width}`);
    }

    while (this.generatedSeams < minSeams) {
      await this.generateSeamBatch();
    }

    return this.seamGrid;
  }
}
