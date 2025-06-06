export class Generator {
  #imageData: ImageData;
  #energyMap: EnergyMap2D;

  constructor(imageData: ImageData) {
    this.#imageData = imageData;
  }
}
