// Uint16Array removal has the best average ranking across environments

// Seam removal benchmark
(() => {
  const ARRAY_SIZE = 4096 * 4096;
  const SEAM_SIZE = 4096;
  const ITERATIONS = 10;

  const baseArray = Array.from({ length: ARRAY_SIZE }, (_, i) => i);
  const baseUint16Array = new Uint16Array(baseArray);
  const seamIndices = Array.from({ length: SEAM_SIZE }, () =>
    Math.floor(Math.random() * ARRAY_SIZE)
  ).sort((a, b) => a - b);
  const seamIndicesDesc = [...seamIndices].sort((a, b) => b - a);

  // Create a linked list from an array
  function createLinkedList(array) {
    if (array.length === 0) return null;

    const head = { value: array[0], next: null };
    let current = head;

    for (let i = 1; i < array.length; i++) {
      current.next = { value: array[i], next: null };
      current = current.next;
    }

    return head;
  }

  function spliceBasedRemoval(array, indices) {
    for (const index of indices) {
      array.splice(index, 1);
    }
    return array;
  }

  function bulkDeleteArrayIndicesBitmask(array, indicesToRemove) {
    const deleted = new Uint8Array(array.length);

    for (const index of indicesToRemove) {
      deleted[index] = 1;
    }

    let writeIndex = 0;
    const arrayLen = array.length;

    for (let readIndex = 0; readIndex < arrayLen; readIndex++) {
      if (!deleted[readIndex]) {
        array[writeIndex] = array[readIndex];
        writeIndex++;
      }
    }

    array.length = writeIndex;
    return array;
  }

  function sortedIndicesRemoval(array, sortedIndices) {
    const arrayLength = array.length;
    let writeIndex = 0;
    let deleteIndex = 0;
    let nextDeleteIndex = sortedIndices[0];

    for (let readIndex = 0; readIndex < arrayLength; readIndex++) {
      if (readIndex === nextDeleteIndex) {
        nextDeleteIndex = sortedIndices[++deleteIndex];
      } else {
        array[writeIndex++] = array[readIndex];
      }
    }

    array.length = writeIndex;
    return array;
  }

  function uint16ArrayRemoval(array, indicesToRemove) {
    const deleted = new Uint8Array(array.length);

    for (const index of indicesToRemove) {
      deleted[index] = 1;
    }

    let writeIndex = 0;
    for (let i = 0; i < array.length; i++) {
      if (!deleted[i]) {
        array[writeIndex++] = array[i];
      }
    }

    return array.subarray(0, writeIndex);
  }

  function sortedUint16ArrayRemoval(array, sortedIndices) {
    const arrayLength = array.length;
    let writeIndex = 0;
    let deleteIndex = 0;
    let nextDeleteIndex = sortedIndices[0];

    for (let readIndex = 0; readIndex < arrayLength; readIndex++) {
      if (readIndex === nextDeleteIndex) {
        nextDeleteIndex = sortedIndices[++deleteIndex];
      } else {
        array[writeIndex++] = array[readIndex];
      }
    }

    return array.subarray(0, writeIndex);
  }

  function inPlaceFilterRemoval(array, indicesToRemove) {
    // Create a set for faster lookups
    const removeSet = new Set(indicesToRemove);
    // Use in-place filter with index check
    let writeIndex = 0;
    for (let i = 0; i < array.length; i++) {
      if (!removeSet.has(i)) {
        array[writeIndex++] = array[i];
      }
    }
    array.length = writeIndex;
    return array;
  }

  function chunkProcessingRemoval(array, sortedIndices) {
    // This approach processes chunks of unaffected elements at once
    // rather than checking every element individually
    let result = [];
    let lastIndex = 0;
    let deletePtr = 0;

    while (lastIndex < array.length && deletePtr < sortedIndices.length) {
      const nextDeleteIndex = sortedIndices[deletePtr];

      // Copy chunk from lastIndex to nextDeleteIndex (exclusive)
      if (nextDeleteIndex > lastIndex) {
        const chunk = array.slice(lastIndex, nextDeleteIndex);
        result.push(...chunk);
      }

      // Skip the element to delete
      lastIndex = nextDeleteIndex + 1;
      deletePtr++;
    }

    // Add any remaining elements after the last deleted index
    if (lastIndex < array.length) {
      const chunk = array.slice(lastIndex);
      result.push(...chunk);
    }

    return result;
  }

  function bitsetRemoval(array, sortedIndices) {
    // Use a bit set (Uint32Array) for potentially faster bit operations
    const bitsetSize = Math.ceil(array.length / 32);
    const bitset = new Uint32Array(bitsetSize);

    // Mark indices to remove in the bitset
    for (const index of sortedIndices) {
      const bitIndex = Math.floor(index / 32);
      const bitOffset = index % 32;
      bitset[bitIndex] |= 1 << bitOffset;
    }

    const result = [];
    for (let i = 0; i < array.length; i++) {
      const bitIndex = Math.floor(i / 32);
      const bitOffset = i % 32;
      if (!(bitset[bitIndex] & (1 << bitOffset))) {
        result.push(array[i]);
      }
    }

    return result;
  }

  function preAllocatedUint16ArrayProcessing(array, sortedIndices) {
    // Pre-allocate exact result size to avoid array growth
    const newSize = array.length - sortedIndices.length;
    const result = new Uint16Array(newSize);

    let writeIndex = 0;
    let deleteIndex = 0;
    let nextDeleteIndex = sortedIndices[0];

    for (let readIndex = 0; readIndex < array.length; readIndex++) {
      if (readIndex === nextDeleteIndex) {
        nextDeleteIndex = sortedIndices[++deleteIndex];
      } else {
        result[writeIndex++] = array[readIndex];
      }
    }

    return result;
  }

  function uint16ArraySetRemoval(array, sortedIndices) {
    // Use set() method to copy chunks efficiently
    const newSize = array.length - sortedIndices.length;
    const result = new Uint16Array(newSize);

    let resultOffset = 0;
    let sourceStart = 0;

    for (const deleteIndex of sortedIndices) {
      // Copy chunk before the deletion index
      const chunkSize = deleteIndex - sourceStart;
      result.set(array.subarray(sourceStart, deleteIndex), resultOffset);
      resultOffset += chunkSize;

      // Skip the element to delete
      sourceStart = deleteIndex + 1;
    }

    // Copy remaining elements after the last deletion
    if (sourceStart < array.length) {
      result.set(array.subarray(sourceStart), resultOffset);
    }

    return result;
  }

  function linkedListRemoval(head, sortedIndices) {
    // Create a dummy head to simplify handling the real head
    const dummy = { value: -1, next: head };
    let current = dummy;
    let position = 0;
    let indexPtr = 0;
    let nextDeleteIndex = sortedIndices[indexPtr];

    // Traverse the list
    while (current.next) {
      if (position === nextDeleteIndex) {
        // Remove this node
        current.next = current.next.next;
        // Move to next index to delete
        nextDeleteIndex = sortedIndices[++indexPtr];
      } else {
        // Move to next node
        current = current.next;
      }
      position++;
    }

    return dummy.next;
  }

  // Create base linked list for benchmarking
  const baseLinkedList = createLinkedList(baseArray);

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

  console.log('Starting seam removal benchmark...');

  const bitmaskTime = benchmark('Bitmask removal', () => {
    const array = [...baseArray];
    bulkDeleteArrayIndicesBitmask(array, seamIndices);
  });

  const sortedTime = benchmark('Sorted removal', () => {
    const array = [...baseArray];
    sortedIndicesRemoval(array, seamIndices);
  });

  // const spliceTime = benchmark('Splice removal', () => {
  //   const array = [...baseArray];
  //   spliceBasedRemoval(array, seamIndicesDesc);
  // });

  const uint16Time = benchmark('Uint16Array removal', () => {
    const array = new Uint16Array(baseUint16Array);
    uint16ArrayRemoval(array, seamIndices);
  });

  const sortedUint16Time = benchmark('Sorted Uint16Array removal', () => {
    const array = new Uint16Array(baseUint16Array);
    sortedUint16ArrayRemoval(array, seamIndices);
  });

  const inPlaceTime = benchmark('In-place filter', () => {
    const array = [...baseArray];
    inPlaceFilterRemoval(array, seamIndices);
  });

  const chunkTime = benchmark('Chunk processing', () => {
    const array = [...baseArray];
    chunkProcessingRemoval(array, seamIndices);
  });

  const bitsetTime = benchmark('Bitset removal', () => {
    const array = [...baseArray];
    bitsetRemoval(array, seamIndices);
  });

  const preAllocatedTime = benchmark('Pre-allocated Uint16Array', () => {
    const array = new Uint16Array(baseUint16Array);
    preAllocatedUint16ArrayProcessing(array, seamIndices);
  });

  const uint16SetTime = benchmark('Uint16Array set() removal', () => {
    const array = new Uint16Array(baseUint16Array);
    uint16ArraySetRemoval(array, seamIndices);
  });

  const linkedListTime = benchmark('Linked List removal', () => {
    // We need to recreate the linked list for each iteration
    // because the removal modifies the original list
    const list = createLinkedList(baseArray);
    linkedListRemoval(list, seamIndices);
  });

  // Store results in an array and sort
  const results = [
    [bitmaskTime, 'Bitmask removal'],
    [sortedTime, 'Sorted removal'],
    // [spliceTime, 'Splice removal'],
    [uint16Time, 'Uint16Array removal'],
    [sortedUint16Time, 'Sorted Uint16Array removal'],
    [inPlaceTime, 'In-place filter'],
    [chunkTime, 'Chunk processing'],
    [bitsetTime, 'Bitset removal'],
    [preAllocatedTime, 'Pre-allocated Uint16Array'],
    [uint16SetTime, 'Uint16Array set() removal'],
    [linkedListTime, 'Linked List removal'],
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
})();
