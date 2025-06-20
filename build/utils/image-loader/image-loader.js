class EvenWidthImage extends Image {
    #rotate;
    constructor(options = {}) {
        super();
        this.crossOrigin = `Anonymous`;
        this.#rotate = !!options.rotate;
    }
    get width() {
        const originalWidth = this.#rotate ? super.height : super.width;
        return originalWidth - (originalWidth % 2);
    }
    get height() {
        return this.#rotate ? super.width : super.height;
    }
}
export class ImageLoader {
    #src;
    #imgPromise;
    #imageDataPromise;
    #rotate;
    #profiler;
    constructor(src, options) {
        this.#src = src;
        this.#rotate = options.rotate;
        this.#profiler = options.profiler;
        this.#imgPromise = this.#loadImage();
        this.#imageDataPromise = this.#imgPromise.then((img) => this.#loadImageData(img));
    }
    #loadImage() {
        return new Promise((resolve, reject) => {
            const src = this.#src;
            const img = new EvenWidthImage({ rotate: this.#rotate });
            img.onload = () => resolve(img);
            img.onerror = () => reject(`Failed to load image: ${src}`);
            img.onabort = () => reject(`Image loading aborted: ${src}`);
            img.src = src;
        });
    }
    #loadImageData(image) {
        const profiler = this.#profiler;
        return new Promise((resolve) => {
            profiler.start('loadImageData');
            const canvas = new OffscreenCanvas(image.width, image.height);
            const context = canvas.getContext('2d');
            if (this.#rotate) {
                context.translate(image.width, 0);
                context.rotate(Math.PI / 2);
            }
            context.drawImage(image, 0, 0);
            const imageData = context.getImageData(0, 0, image.width, image.height);
            profiler.end('loadImageData');
            resolve(imageData);
        });
    }
    get src() {
        return this.#src;
    }
    get image() {
        return this.#imgPromise;
    }
    get imageData() {
        return this.#imageDataPromise;
    }
}
