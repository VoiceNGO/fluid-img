import { URLString } from '../seam-spec/seam-spec';

const imageCache = new WeakMap<URLString, Promise<HTMLImageElement>>();

export async function loadImage(src: URLString): Promise<HTMLImageElement> {
  const cachedPromise = imageCache.get(src);
  if (cachedPromise) {
    return cachedPromise;
  }

  const imagePromise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.onabort = () => reject(new Error(`Image loading aborted: ${src}`));
    img.src = src;
  });

  imageCache.set(src, imagePromise);

  return imagePromise;
}
