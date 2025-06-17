import type { TypedArray, Constructor } from 'type-fest';

export function deleteArrayIndices<T extends TypedArray>(
  array: T,
  uniqueSortedIndicesToRemove: number[],
  elementsPerRemoval: number = 1
): T {
  const newSize = array.length - uniqueSortedIndicesToRemove.length * elementsPerRemoval;
  const ArrayConstructor = array.constructor as Constructor<T>;
  const result = new ArrayConstructor(newSize) as T;

  let resultOffset = 0;
  let sourceStart = 0;
  let lastIndex = -1;

  for (const deleteIndex of uniqueSortedIndicesToRemove) {
    if (lastIndex === deleteIndex) {
      throw new Error('[deleteArrayIndices]: Duplicate index detected');
    }
    if (lastIndex > deleteIndex) {
      throw new Error('[deleteArrayIndices]: Indices are not sorted');
    }

    const chunkSize = deleteIndex - sourceStart;

    if (chunkSize > 0) {
      (result as any).set(array.subarray(sourceStart, deleteIndex), resultOffset);
      resultOffset += chunkSize;
    }

    sourceStart = deleteIndex + elementsPerRemoval;
    lastIndex = deleteIndex;
  }

  if (sourceStart < array.length) {
    (result as any).set(array.subarray(sourceStart), resultOffset);
  }

  return result;
}
