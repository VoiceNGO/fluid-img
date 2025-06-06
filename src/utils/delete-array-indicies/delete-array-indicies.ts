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

  for (const deleteIndex of uniqueSortedIndicesToRemove) {
    const chunkSize = deleteIndex - sourceStart;

    if (chunkSize > 0) {
      (result as any).set(array.subarray(sourceStart, deleteIndex), resultOffset);
      resultOffset += chunkSize;
    }

    sourceStart = deleteIndex + elementsPerRemoval;
  }

  if (sourceStart < array.length) {
    (result as any).set(array.subarray(sourceStart), resultOffset);
  }

  return result;
}

if (true) {
  console.log('Starting performance test for deleteArrayIndices');

  const size = 10;
  console.log(`Generating ${size.toLocaleString()} random elements...`);
  const testArray = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    testArray[i] = Math.floor(Math.random() * 1000000);
  }

  const indicesToRemoveCount = 6;
  console.log(`Generating ${indicesToRemoveCount.toLocaleString()} indices to remove...`);
  const indicesToRemove = new Set<number>();
  while (indicesToRemove.size < indicesToRemoveCount) {
    indicesToRemove.add(Math.floor(Math.random() * size));
  }
  const sortedIndicesToRemove = Array.from(indicesToRemove).sort((a, b) => a - b);

  console.log('Running deleteArrayIndices...');
  const startTime = performance.now();
  const result = deleteArrayIndices(testArray, sortedIndicesToRemove);
  const endTime = performance.now();

  const elapsedMs = endTime - startTime;
  console.log(`Operation completed in ${elapsedMs.toFixed(2)}ms`);
  console.log(
    `Removed ${indicesToRemoveCount.toLocaleString()} elements from array of ${size.toLocaleString()}`
  );
  console.log(`Result array length: ${result.length.toLocaleString()}`);
}
