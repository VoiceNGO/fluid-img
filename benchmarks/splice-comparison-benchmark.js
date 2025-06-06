// benchmarks/splice-comparison-benchmark.js

(() => {
  const ARRAY_SIZE = 1_000_000;
  const INDICES_TO_REMOVE_COUNT = 1_000;
  const ITERATIONS = 100;

  function generateTupleArray(size) {
    const arr = new Array(size);
    for (let i = 0; i < size; i++) {
      arr[i] = [i, Math.floor(Math.random() * 256)];
    }
    return arr;
  }

  function generateTwoArrays(size) {
    const originalIndices = new Uint32Array(size);
    const values = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      originalIndices[i] = i;
      values[i] = Math.floor(Math.random() * 256);
    }
    return { originalIndices, values };
  }

  function generateInterleavedArray(size) {
    const arr = new Int32Array(size * 2);
    for (let i = 0; i < size; i++) {
      arr[i * 2] = i;
      arr[i * 2 + 1] = Math.floor(Math.random() * 256);
    }
    return arr;
  }

  function generateRandomIndicesToRemove(maxIndex, count) {
    const indices = new Set();
    while (indices.size < count) {
      indices.add(Math.floor(Math.random() * maxIndex));
    }
    if (count > 0 && indices.size === 0 && maxIndex > 0) {
      indices.add(0);
    }
    if (count === 0 && maxIndex === 0 && indices.size === 0) {
      return [];
    }
    return Array.from(indices).sort((a, b) => a - b);
  }

  function removeViaTuples(tupleArray, indicesToRemove) {
    if (indicesToRemove.length === 0) return [...tupleArray];

    const newSize = tupleArray.length - indicesToRemove.length;
    const result = new Array(newSize);

    let resultOffset = 0;
    let sourceStart = 0;

    for (const deleteIndex of indicesToRemove) {
      const chunkSize = deleteIndex - sourceStart;

      if (chunkSize > 0) {
        for (let i = 0; i < chunkSize; i++) {
          result[resultOffset + i] = tupleArray[sourceStart + i];
        }
        resultOffset += chunkSize;
      }

      sourceStart = deleteIndex + 1;
    }

    if (sourceStart < tupleArray.length) {
      for (let i = sourceStart; i < tupleArray.length; i++) {
        result[resultOffset++] = tupleArray[i];
      }
    }

    return result;
  }

  function removeViaTwoArrays(originalIndicesArray, valuesArray, indicesToRemove) {
    if (indicesToRemove.length === 0) {
      return {
        resultOriginalIndices: new Uint32Array(originalIndicesArray),
        resultValues: new Uint8Array(valuesArray),
      };
    }

    const newSize = originalIndicesArray.length - indicesToRemove.length;
    const resultOriginalIndices = new Uint32Array(newSize);
    const resultValues = new Uint8Array(newSize);

    // Remove from first array
    let resultOffset = 0;
    let sourceStart = 0;

    for (const deleteIndex of indicesToRemove) {
      const chunkSize = deleteIndex - sourceStart;

      if (chunkSize > 0) {
        resultOriginalIndices.set(
          originalIndicesArray.subarray(sourceStart, deleteIndex),
          resultOffset
        );
        resultOffset += chunkSize;
      }

      sourceStart = deleteIndex + 1;
    }

    if (sourceStart < originalIndicesArray.length) {
      resultOriginalIndices.set(originalIndicesArray.subarray(sourceStart), resultOffset);
    }

    // Remove from second array
    resultOffset = 0;
    sourceStart = 0;

    for (const deleteIndex of indicesToRemove) {
      const chunkSize = deleteIndex - sourceStart;

      if (chunkSize > 0) {
        resultValues.set(valuesArray.subarray(sourceStart, deleteIndex), resultOffset);
        resultOffset += chunkSize;
      }

      sourceStart = deleteIndex + 1;
    }

    if (sourceStart < valuesArray.length) {
      resultValues.set(valuesArray.subarray(sourceStart), resultOffset);
    }

    return { resultOriginalIndices, resultValues };
  }

  function removeViaInterleavedArray(interleavedArray, indicesToRemove) {
    if (indicesToRemove.length === 0) return new Int32Array(interleavedArray);

    const elementsPerRemoval = 2; // Each pair consists of 2 elements
    const newSize = interleavedArray.length - indicesToRemove.length * elementsPerRemoval;
    const result = new Int32Array(newSize);

    let resultOffset = 0;
    let sourceStart = 0;

    for (const deleteIndex of indicesToRemove) {
      const chunkSize = deleteIndex * elementsPerRemoval - sourceStart;

      if (chunkSize > 0) {
        result.set(
          interleavedArray.subarray(sourceStart, deleteIndex * elementsPerRemoval),
          resultOffset
        );
        resultOffset += chunkSize;
      }

      sourceStart = (deleteIndex + 1) * elementsPerRemoval;
    }

    if (sourceStart < interleavedArray.length) {
      result.set(interleavedArray.subarray(sourceStart), resultOffset);
    }

    return result;
  }

  function benchmark(name, fn, iterations = ITERATIONS) {
    const start = performance.now();
    for (let k = 0; k < iterations; k++) {
      fn();
    }
    const end = performance.now();
    const avgTime = (end - start) / iterations;
    console.log(`${name}: ${avgTime.toFixed(3)}ms per run`);
    return avgTime;
  }

  console.log('='.repeat(60));
  console.log('SPLICE REMOVAL STRATEGY BENCHMARK (GAP COPYING)');
  console.log('='.repeat(60));
  console.log(`Array Size: ${ARRAY_SIZE.toLocaleString()} elements/pairs`);
  console.log(`Indices to Remove: ${INDICES_TO_REMOVE_COUNT.toLocaleString()}`);
  console.log(`Iterations per test: ${ITERATIONS}`);
  console.log('\n--- Generating Test Data ---');

  const baseTupleArray = generateTupleArray(ARRAY_SIZE);
  const { originalIndices: baseOriginalIndices, values: baseValues } =
    generateTwoArrays(ARRAY_SIZE);
  const baseInterleavedArray = generateInterleavedArray(ARRAY_SIZE);
  const indicesToRemove = generateRandomIndicesToRemove(ARRAY_SIZE, INDICES_TO_REMOVE_COUNT);

  if (INDICES_TO_REMOVE_COUNT > 0 && indicesToRemove.length === 0 && ARRAY_SIZE > 0) {
    indicesToRemove.push(0);
    indicesToRemove.sort((a, b) => a - b);
  }

  console.log('Test data generated.');
  console.log('\n--- Running Benchmarks ---');

  const results = [];

  results.push({
    name: 'Tuple Array Removal',
    time: benchmark('Tuple Array Removal', () => {
      let data = [...baseTupleArray];
      removeViaTuples(data, indicesToRemove);
    }),
  });

  results.push({
    name: 'Two Arrays Removal',
    time: benchmark('Two Arrays Removal', () => {
      let oia = new Uint32Array(baseOriginalIndices);
      let va = new Uint8Array(baseValues);
      removeViaTwoArrays(oia, va, indicesToRemove);
    }),
  });

  results.push({
    name: 'Interleaved Array Removal',
    time: benchmark('Interleaved Array Removal', () => {
      let data = new Int32Array(baseInterleavedArray);
      removeViaInterleavedArray(data, indicesToRemove);
    }),
  });

  console.log('\n--- Results Summary ---');
  results.sort((a, b) => a.time - b.time);

  const winner = results[0];
  results.forEach((result, index) => {
    if (index === 0) {
      console.log(`  ${result.name}: ${result.time.toFixed(3)}ms (Winner)`);
    } else {
      const ratio = (result.time / winner.time).toFixed(2);
      console.log(`  ${result.name}: ${result.time.toFixed(3)}ms (${ratio}x slower)`);
    }
  });

  console.log('='.repeat(60));
})();
