export function getImageData(image: HTMLImageElement): ImageData {
  const canvas = new OffscreenCanvas(image.width, image.height);
  const context = canvas.getContext('2d')!;

  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}
