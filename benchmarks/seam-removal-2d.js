// 2D Seam removal benchmark - remove one element from each row of a 1024x1024 array

(() => {
  const ARRAY_WIDTH = 4096;
  const ARRAY_HEIGHT = 4096;
  const ITERATIONS = 10;

  // Create 2D array (1024x1024)
  const base2DArray = Array.from({ length: ARRAY_HEIGHT }, (_, row) =>
    Array.from({ length: ARRAY_WIDTH }, (_, col) => row * ARRAY_WIDTH + col)
  );

  // Create typed array version
  const baseUint16Array2D = base2DArray.map((row) => new Uint16Array(row));

  // Generate one random index to remove from each row
  const seamIndicesPerRow = Array.from({ length: ARRAY_HEIGHT }, () =>
    Math.floor(Math.random() * ARRAY_WIDTH)
  );

  function spliceBasedRemoval2D(array2d, indicesPerRow) {
    for (let row = 0; row < array2d.length; row++) {
      array2d[row].splice(indicesPerRow[row], 1);
    }
    return array2d;
  }

  function bulkDeleteArrayIndicesBitmask2D(array2d, indicesPerRow) {
    for (let row = 0; row < array2d.length; row++) {
      const rowArray = array2d[row];
      const indexToRemove = indicesPerRow[row];

      // Optimized: shift elements from removal index onwards
      for (let col = indexToRemove; col < rowArray.length - 1; col++) {
        rowArray[col] = rowArray[col + 1];
      }
      rowArray.length = rowArray.length - 1;
    }
    return array2d;
  }

  function sortedIndicesRemoval2D(array2d, indicesPerRow) {
    for (let row = 0; row < array2d.length; row++) {
      const rowArray = array2d[row];
      const indexToRemove = indicesPerRow[row];

      // Optimized: shift elements from removal index onwards
      for (let col = indexToRemove; col < rowArray.length - 1; col++) {
        rowArray[col] = rowArray[col + 1];
      }
      rowArray.length = rowArray.length - 1;
    }
    return array2d;
  }

  function uint16ArrayRemoval2D(array2d, indicesPerRow) {
    const result = [];
    for (let row = 0; row < array2d.length; row++) {
      const rowArray = array2d[row];
      const indexToRemove = indicesPerRow[row];

      // Optimized: shift elements from removal index onwards
      for (let col = indexToRemove; col < rowArray.length - 1; col++) {
        rowArray[col] = rowArray[col + 1];
      }
      result.push(rowArray.subarray(0, rowArray.length - 1));
    }
    return result;
  }

  function sortedUint16ArrayRemoval2D(array2d, indicesPerRow) {
    const result = [];
    for (let row = 0; row < array2d.length; row++) {
      const rowArray = array2d[row];
      const indexToRemove = indicesPerRow[row];

      // Optimized: shift elements from removal index onwards
      for (let col = indexToRemove; col < rowArray.length - 1; col++) {
        rowArray[col] = rowArray[col + 1];
      }
      result.push(rowArray.subarray(0, rowArray.length - 1));
    }
    return result;
  }

  function inPlaceFilterRemoval2D(array2d, indicesPerRow) {
    for (let row = 0; row < array2d.length; row++) {
      const rowArray = array2d[row];
      const indexToRemove = indicesPerRow[row];

      // Optimized: shift elements from removal index onwards
      for (let col = indexToRemove; col < rowArray.length - 1; col++) {
        rowArray[col] = rowArray[col + 1];
      }
      rowArray.length = rowArray.length - 1;
    }
    return array2d;
  }

  function chunkProcessingRemoval2D(array2d, indicesPerRow) {
    const result = [];
    for (let row = 0; row < array2d.length; row++) {
      const rowArray = array2d[row];
      const indexToRemove = indicesPerRow[row];

      // Copy elements before the removal index
      const beforeChunk = rowArray.slice(0, indexToRemove);
      // Copy elements after the removal index
      const afterChunk = rowArray.slice(indexToRemove + 1);

      result.push([...beforeChunk, ...afterChunk]);
    }
    return result;
  }

  function bitsetRemoval2D(array2d, indicesPerRow) {
    const result = [];
    for (let row = 0; row < array2d.length; row++) {
      const rowArray = array2d[row];
      const indexToRemove = indicesPerRow[row];

      const newRow = [];
      for (let col = 0; col < rowArray.length; col++) {
        if (col !== indexToRemove) {
          newRow.push(rowArray[col]);
        }
      }
      result.push(newRow);
    }
    return result;
  }

  function preAllocatedUint16ArrayProcessing2D(array2d, indicesPerRow) {
    const result = [];
    for (let row = 0; row < array2d.length; row++) {
      const rowArray = array2d[row];
      const indexToRemove = indicesPerRow[row];

      // Pre-allocate exact result size
      const newRow = new Uint16Array(rowArray.length - 1);

      // Optimized: copy before removal index, then copy after removal index
      // Copy elements before the removal index
      for (let col = 0; col < indexToRemove; col++) {
        newRow[col] = rowArray[col];
      }
      // Copy elements after the removal index
      for (let col = indexToRemove + 1; col < rowArray.length; col++) {
        newRow[col - 1] = rowArray[col];
      }

      result.push(newRow);
    }
    return result;
  }

  function uint16ArraySet2D(array2d, indicesPerRow) {
    const result = [];
    for (let row = 0; row < array2d.length; row++) {
      const rowArray = array2d[row];
      const indexToRemove = indicesPerRow[row];

      // Use set() method to copy chunks efficiently
      const newRow = new Uint16Array(rowArray.length - 1);

      // Copy chunk before the removal index
      const chunkSize = indexToRemove;
      newRow.set(rowArray.subarray(0, indexToRemove), 0);

      // Copy chunk after the removal index
      newRow.set(rowArray.subarray(indexToRemove + 1), chunkSize);

      result.push(newRow);
    }
    return result;
  }

  function benchmark(name, fn, iterations = ITERATIONS) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = performance.now();
    const avgTime = (end - start) / iterations;
    console.log(`${name}: ${avgTime.toFixed(2)}ms avg`);
    return avgTime;
  }

  console.log('Starting 2D seam removal benchmark...');
  console.log(
    `Array dimensions: ${ARRAY_HEIGHT}x${ARRAY_WIDTH} (${ARRAY_HEIGHT * ARRAY_WIDTH} total elements)`
  );
  console.log(`Removing ${ARRAY_HEIGHT} elements (one per row)`);

  const bitmaskTime = benchmark('2D Bitmask removal', () => {
    const array = base2DArray.map((row) => [...row]);
    bulkDeleteArrayIndicesBitmask2D(array, seamIndicesPerRow);
  });

  const sortedTime = benchmark('2D Sorted removal', () => {
    const array = base2DArray.map((row) => [...row]);
    sortedIndicesRemoval2D(array, seamIndicesPerRow);
  });

  const spliceTime = benchmark('2D Splice removal', () => {
    const array = base2DArray.map((row) => [...row]);
    spliceBasedRemoval2D(array, seamIndicesPerRow);
  });

  const uint16Time = benchmark('2D Uint16Array removal', () => {
    const array = baseUint16Array2D.map((row) => new Uint16Array(row));
    uint16ArrayRemoval2D(array, seamIndicesPerRow);
  });

  const sortedUint16Time = benchmark('2D Sorted Uint16Array removal', () => {
    const array = baseUint16Array2D.map((row) => new Uint16Array(row));
    sortedUint16ArrayRemoval2D(array, seamIndicesPerRow);
  });

  const inPlaceTime = benchmark('2D In-place filter', () => {
    const array = base2DArray.map((row) => [...row]);
    inPlaceFilterRemoval2D(array, seamIndicesPerRow);
  });

  const chunkTime = benchmark('2D Chunk processing', () => {
    const array = base2DArray.map((row) => [...row]);
    chunkProcessingRemoval2D(array, seamIndicesPerRow);
  });

  const bitsetTime = benchmark('2D Bitset removal', () => {
    const array = base2DArray.map((row) => [...row]);
    bitsetRemoval2D(array, seamIndicesPerRow);
  });

  const preAllocatedTime = benchmark('2D Pre-allocated Uint16Array', () => {
    const array = baseUint16Array2D.map((row) => new Uint16Array(row));
    preAllocatedUint16ArrayProcessing2D(array, seamIndicesPerRow);
  });

  const uint16SetTime = benchmark('2D Uint16Array set() removal', () => {
    const array = baseUint16Array2D.map((row) => new Uint16Array(row));
    uint16ArraySet2D(array, seamIndicesPerRow);
  });

  // Store results in an array and sort
  const results = [
    [bitmaskTime, '2D Bitmask removal'],
    [sortedTime, '2D Sorted removal'],
    [spliceTime, '2D Splice removal'],
    [uint16Time, '2D Uint16Array removal'],
    [sortedUint16Time, '2D Sorted Uint16Array removal'],
    [inPlaceTime, '2D In-place filter'],
    [chunkTime, '2D Chunk processing'],
    [bitsetTime, '2D Bitset removal'],
    [preAllocatedTime, '2D Pre-allocated Uint16Array'],
    [uint16SetTime, '2D Uint16Array set() removal'],
  ].sort((a, b) => a[0] - b[0]);

  console.log('\n2D Results (sorted by time):');
  const winner = results[0][0];
  results.forEach(([time, name], index) => {
    if (index === 0) {
      console.log(`${name}: ${time.toFixed(2)}ms (winner)`);
    } else {
      const ratio = (time / winner).toFixed(1);
      console.log(`${name}: ${time.toFixed(2)}ms (${ratio}x slower)`);
    }
  });
})();
