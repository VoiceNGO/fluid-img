// typed arrays either tie or are significantly faster in most environments

// Typed vs Regular Arrays Performance Test
{
  const ARRAY_SIZE = 1000000;
  const REMOVE_COUNT = 1000;

  const baseRegularArray = Array.from({ length: ARRAY_SIZE }, (_, i) => i);
  const baseTypedArray = new Uint16Array(baseRegularArray);
  const indicesToRemove = Array.from({ length: REMOVE_COUNT }, () =>
    Math.floor(Math.random() * ARRAY_SIZE)
  );

  function bulkDeleteArrayIndices(array, indicesToRemove) {
    if (indicesToRemove.length === 0) {
      return array;
    }

    const deleted = new Uint8Array(array.length);

    for (const index of indicesToRemove) {
      if (index >= 0 && index < array.length) {
        deleted[index] = 1;
      }
    }

    let writeIndex = 0;
    const arrayLen = array.length;

    for (let readIndex = 0; readIndex < arrayLen; readIndex++) {
      if (!deleted[readIndex]) {
        array[writeIndex] = array[readIndex];
        writeIndex++;
      }
    }

    if (array.subarray) {
      return array.subarray(0, writeIndex);
    } else {
      array.length = writeIndex;
      return array;
    }
  }

  function benchmark(name, fn, iterations = 10) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = performance.now();
    const avgTime = (end - start) / iterations;
    console.log(`${name}: ${avgTime.toFixed(2)}ms avg`);
    return avgTime;
  }

  console.log('Typed vs Regular Arrays Performance Test');

  const regularTime = benchmark('Regular Array', () => {
    const regularArray = [...baseRegularArray];
    bulkDeleteArrayIndices(regularArray, indicesToRemove);
  });

  const typedTime = benchmark('Uint16Array', () => {
    const typedArray = new Uint16Array(baseTypedArray);
    bulkDeleteArrayIndices(typedArray, indicesToRemove);
  });

  // Store results in an array and sort
  const results = [
    [regularTime, 'Regular Array'],
    [typedTime, 'Uint16Array'],
  ].sort((a, b) => a[0] - b[0]);

  console.log('\nResults (sorted by time):');
  const winner = results[0][0];
  results.forEach(([time, name], index) => {
    if (index === 0) {
      console.log(`${name}: ${time.toFixed(2)}ms (winner)`);
    } else {
      const ratio = (time / winner).toFixed(1);
      console.log(`${name}: ${time.toFixed(2)}ms (${ratio}x slower)`);
    }
  });
}
