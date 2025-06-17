class EvenWidthImage extends Image {
  #rotate: boolean;

  constructor(options: { rotate?: boolean } = {}) {
    super();
    this.crossOrigin = `Anonymous`;
    this.#rotate = !!options.rotate;
  }

  override get width(): number {
    const originalWidth = this.#rotate ? super.height : super.width;
    return originalWidth - (originalWidth % 2);
  }

  override get height(): number {
    return this.#rotate ? super.width : super.height;
  }
}

export class ImageLoader {
  #src: string;
  #imgPromise: Promise<HTMLImageElement>;
  #imageDataPromise: Promise<ImageData>;
  #rotate: boolean;

  constructor(src: string, options: { rotate?: boolean } = {}) {
    this.#src = src;
    this.#rotate = options.rotate ?? false;
    this.#imgPromise = this.#loadImage();
    this.#imageDataPromise = this.#imgPromise.then((img) => this.#loadImageData(img));
  }

  #loadImage(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const src = this.#src;
      const img = new EvenWidthImage({ rotate: this.#rotate });
      img.onload = () => resolve(img);
      img.onerror = () => reject(`Failed to load image: ${src}`);
      img.onabort = () => reject(`Image loading aborted: ${src}`);
      img.src = src;
    });
  }

  #loadImageData(image: HTMLImageElement): Promise<ImageData> {
    return new Promise((resolve) => {
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext('2d')!;

      if (this.#rotate) {
        context.translate(image.width, 0);
        context.rotate(Math.PI / 2);
      }

      context.drawImage(image, 0, 0);

      resolve(context.getImageData(0, 0, image.width, image.height));
    });
  }

  get src(): string {
    return this.#src;
  }

  get image(): Promise<HTMLImageElement> {
    return this.#imgPromise;
  }

  get imageData(): Promise<ImageData> {
    return this.#imageDataPromise;
  }
}
