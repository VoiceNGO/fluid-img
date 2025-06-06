// Production Seam Removal Test - Realistic image processing scenarios
// Tests removing RGBA pixel groups (4 sequential elements) from various image sizes

(() => {
  const ITERATIONS = 5;
  const SEAMS_TO_REMOVE = 10;
  const ELEMENTS_PER_REMOVAL = 4; // RGBA components

  // Image sizes for various devices and screen sizes
  const IMAGE_SIZES = [
    { name: 'Mobile Small', width: 400, height: 300 },
    { name: 'Mobile Large', width: 800, height: 600 },
    { name: 'Tablet', width: 1024, height: 768 },
    { name: 'Desktop HD', width: 1920, height: 1080 },
    { name: 'Desktop 2K', width: 2560, height: 1440 },
    { name: 'Desktop 4K', width: 3840, height: 2160 },
    { name: 'Large Display', width: 4000, height: 3000 },
  ];

  // Modified functions to handle sequential element removal
  function uint16ArraySetRemovalSequential(array, seamIndices, elementsPerRemoval) {
    // seamIndices is already a sorted array of indices to remove
    const newSize = array.length - seamIndices.length;
    const result = new Uint16Array(newSize);

    let resultOffset = 0;
    let sourceStart = 0;

    for (const deleteIndex of seamIndices) {
      // Copy chunk before the deletion index
      const chunkSize = deleteIndex - sourceStart;
      if (chunkSize > 0) {
        result.set(array.subarray(sourceStart, deleteIndex), resultOffset);
        resultOffset += chunkSize;
      }
      // Skip the element to delete
      sourceStart = deleteIndex + 1;
    }

    // Copy remaining elements after the last deletion
    if (sourceStart < array.length) {
      result.set(array.subarray(sourceStart), resultOffset);
    }

    return result;
  }

  function sortedUint16ArrayRemovalSequential(array, seamIndices, elementsPerRemoval) {
    // seamIndices is already a sorted array of indices to remove
    const arrayLength = array.length;
    let writeIndex = 0;
    let deleteIndex = 0;
    let nextDeleteIndex = seamIndices[0];

    for (let readIndex = 0; readIndex < arrayLength; readIndex++) {
      if (readIndex === nextDeleteIndex) {
        nextDeleteIndex = seamIndices[++deleteIndex];
      } else {
        array[writeIndex++] = array[readIndex];
      }
    }

    return array.subarray(0, writeIndex);
  }

  function uint16ArraySet2DSequential(array2d, seamIndices, elementsPerRemoval) {
    const result = array2d.map((row) => new Uint16Array(row)); // Copy all rows initially

    for (const seam of seamIndices) {
      const rowArray = result[seam.row];
      const baseIndex = seam.col;

      // Calculate new row size after removing sequential elements
      const newRowSize = rowArray.length - elementsPerRemoval;
      const newRow = new Uint16Array(newRowSize);

      // Copy chunk before the removal indices
      newRow.set(rowArray.subarray(0, baseIndex), 0);

      // Copy chunk after the removal indices
      const afterStart = baseIndex + elementsPerRemoval;
      if (afterStart < rowArray.length) {
        newRow.set(rowArray.subarray(afterStart), baseIndex);
      }

      result[seam.row] = newRow;
    }
    return result;
  }

  function sortedUint16ArrayRemoval2DSequential(array2d, seamIndices, elementsPerRemoval) {
    const result = array2d.map((row) => new Uint16Array(row)); // Copy all rows initially

    for (const seam of seamIndices) {
      const rowArray = result[seam.row];
      const baseIndex = seam.col;

      // Optimized: shift elements from removal index onwards
      for (let col = baseIndex; col < rowArray.length - elementsPerRemoval; col++) {
        rowArray[col] = rowArray[col + elementsPerRemoval];
      }
      result[seam.row] = rowArray.subarray(0, rowArray.length - elementsPerRemoval);
    }
    return result;
  }

  function uint16ArrayRemoval2DSequential(array2d, seamIndices, elementsPerRemoval) {
    const result = array2d.map((row) => new Uint16Array(row)); // Copy all rows initially

    for (const seam of seamIndices) {
      const rowArray = result[seam.row];
      const baseIndex = seam.col;

      // Optimized: shift elements from removal index onwards
      for (let col = baseIndex; col < rowArray.length - elementsPerRemoval; col++) {
        rowArray[col] = rowArray[col + elementsPerRemoval];
      }
      result[seam.row] = rowArray.subarray(0, rowArray.length - elementsPerRemoval);
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
    return avgTime;
  }

  function generateSeamIndices(imageWidth, imageHeight, numSeams, elementsPerRemoval) {
    const seams = [];
    let currentWidth = imageWidth; // Track current width as seams are removed

    for (let seamNum = 0; seamNum < numSeams; seamNum++) {
      const seamIndices = [];
      // Generate random vertical seam (one element per row)
      for (let row = 0; row < imageHeight; row++) {
        const rowStart = row * currentWidth * 4;

        // Generate random index within this row, aligned to 4-byte boundaries
        // and ensure we don't overflow when adding elementsPerRemoval
        const maxPixelInRow = currentWidth - 1; // Leave room for RGBA components
        const randomPixel = Math.floor(Math.random() * maxPixelInRow);
        const pixelIndex = rowStart + randomPixel * 4;

        // Add sequential elements (RGBA components)
        for (let i = 0; i < elementsPerRemoval; i++) {
          seamIndices.push(pixelIndex + i);
        }
      }
      seams.push(seamIndices.sort((a, b) => a - b));

      // Reduce width for next seam (each seam removes one pixel column)
      currentWidth -= 1;
    }

    return seams;
  }

  function generate2DSeamIndices(imageWidth, imageHeight, numSeams) {
    const seams = [];
    let currentWidth = imageWidth; // Track current width as seams are removed

    for (let seamNum = 0; seamNum < numSeams; seamNum++) {
      const seamIndices = [];
      // Generate random vertical seam (one element per row)
      for (let row = 0; row < imageHeight; row++) {
        // Ensure we don't go out of bounds when removing sequential elements
        const maxCol = currentWidth * 4 - ELEMENTS_PER_REMOVAL;
        const col = Math.floor(Math.random() * maxCol);
        seamIndices.push({
          row: row,
          col: col,
        });
      }
      seams.push(seamIndices);

      // Reduce width for next seam (each seam removes one pixel column)
      currentWidth -= 1;
    }

    return seams;
  }

  function runImageSizeTest(imageSize) {
    console.log(`\n=== ${imageSize.name} (${imageSize.width}x${imageSize.height}) ===`);

    const totalPixels = imageSize.width * imageSize.height;
    const arraySize = totalPixels * 4; // RGBA

    // Create test data
    const baseArray = new Uint16Array(arraySize);
    for (let i = 0; i < arraySize; i++) {
      baseArray[i] = i % 65536;
    }

    // Create 2D version (rows of RGBA data)
    const base2DArray = [];
    for (let row = 0; row < imageSize.height; row++) {
      const rowStart = row * imageSize.width * 4;
      const rowEnd = rowStart + imageSize.width * 4;
      base2DArray.push(new Uint16Array(baseArray.subarray(rowStart, rowEnd)));
    }

    // Generate seam removal indices OUTSIDE the testing loop
    const seamIndices = generateSeamIndices(
      imageSize.width,
      imageSize.height,
      SEAMS_TO_REMOVE,
      ELEMENTS_PER_REMOVAL
    );
    const seam2DIndices = generate2DSeamIndices(imageSize.width, imageSize.height, SEAMS_TO_REMOVE);

    console.log(
      `Array size: ${arraySize.toLocaleString()} elements (${((arraySize * 2) / 1024 / 1024).toFixed(1)}MB)`
    );
    console.log(`Removing ${SEAMS_TO_REMOVE} seams of ${ELEMENTS_PER_REMOVAL} elements each`);

    // Run benchmarks
    const results = [];

    // 1D Tests
    const uint16SetTime = benchmark('1D Uint16Array set() removal', () => {
      let array = new Uint16Array(baseArray);
      for (const seam of seamIndices) {
        array = uint16ArraySetRemovalSequential(array, seam, ELEMENTS_PER_REMOVAL);
      }
    });
    results.push([uint16SetTime, '1D Uint16Array set() removal']);

    const sortedUint16Time = benchmark('1D Sorted Uint16Array removal', () => {
      let array = new Uint16Array(baseArray);
      for (const seam of seamIndices) {
        array = sortedUint16ArrayRemovalSequential(array, seam, ELEMENTS_PER_REMOVAL);
      }
    });
    results.push([sortedUint16Time, '1D Sorted Uint16Array removal']);

    // 2D Tests
    const uint16Set2DTime = benchmark('2D Uint16Array set() removal', () => {
      let array = base2DArray.map((row) => new Uint16Array(row));
      for (const seam of seam2DIndices) {
        array = uint16ArraySet2DSequential(array, seam, ELEMENTS_PER_REMOVAL);
      }
    });
    results.push([uint16Set2DTime, '2D Uint16Array set() removal']);

    const sorted2DTime = benchmark('2D Sorted Uint16Array removal', () => {
      let array = base2DArray.map((row) => new Uint16Array(row));
      for (const seam of seam2DIndices) {
        array = sortedUint16ArrayRemoval2DSequential(array, seam, ELEMENTS_PER_REMOVAL);
      }
    });
    results.push([sorted2DTime, '2D Sorted Uint16Array removal']);

    const uint162DTime = benchmark('2D Uint16Array removal', () => {
      let array = base2DArray.map((row) => new Uint16Array(row));
      for (const seam of seam2DIndices) {
        array = uint16ArrayRemoval2DSequential(array, seam, ELEMENTS_PER_REMOVAL);
      }
    });
    results.push([uint162DTime, '2D Uint16Array removal']);

    // Sort results and display
    results.sort((a, b) => a[0] - b[0]);

    console.log('\nResults (sorted by time):');
    const winner = results[0];
    results.forEach(([time, name], index) => {
      if (index === 0) {
        console.log(`  ${name}: ${time.toFixed(2)}ms (winner)`);
      } else {
        const ratio = (time / winner[0]).toFixed(1);
        console.log(`  ${name}: ${time.toFixed(2)}ms (${ratio}x slower)`);
      }
    });

    // Calculate time to remove 50% of seams
    const totalSeamsInImage = Math.min(imageSize.width, imageSize.height);
    const seamsFor50Percent = Math.floor(totalSeamsInImage * 0.5);
    const timeFor50Percent = (winner[0] / SEAMS_TO_REMOVE) * seamsFor50Percent;

    console.log(
      `\nProjected time to remove 50% of seams (${seamsFor50Percent} seams): ${timeFor50Percent.toFixed(2)}ms`
    );

    return {
      imageSize,
      winner: winner[1],
      winnerTime: winner[0],
      timeFor50Percent,
      totalSeams: totalSeamsInImage,
      seamsFor50Percent,
    };
  }

  console.log('='.repeat(60));
  console.log('PRODUCTION SEAM REMOVAL BENCHMARK');
  console.log('='.repeat(60));
  console.log(
    `Testing ${SEAMS_TO_REMOVE} seam removals of ${ELEMENTS_PER_REMOVAL} sequential elements each`
  );
  console.log(`Iterations per test: ${ITERATIONS}`);

  const allResults = [];

  // Run tests for each image size
  for (const imageSize of IMAGE_SIZES) {
    const result = runImageSizeTest(imageSize);
    allResults.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  console.log('\nWinner by image size:');
  allResults.forEach((result) => {
    console.log(
      `${result.imageSize.name.padEnd(15)}: ${result.winner} (${result.winnerTime.toFixed(2)}ms)`
    );
  });

  console.log('\nTime to remove 50% of seams:');
  allResults.forEach((result) => {
    console.log(
      `${result.imageSize.name.padEnd(15)}: ${result.timeFor50Percent.toFixed(2)}ms (${result.seamsFor50Percent} seams)`
    );
  });

  // Find most common winner
  const winnerCounts = {};
  allResults.forEach((result) => {
    winnerCounts[result.winner] = (winnerCounts[result.winner] || 0) + 1;
  });

  const mostCommonWinner = Object.entries(winnerCounts).sort((a, b) => b[1] - a[1])[0];

  console.log(
    `\nMost consistent performer: ${mostCommonWinner[0]} (won ${mostCommonWinner[1]}/${allResults.length} tests)`
  );

  // Performance scaling analysis
  console.log('\nPerformance scaling:');
  const smallestResult = allResults[0];
  const largestResult = allResults[allResults.length - 1];
  const sizeRatio =
    (largestResult.imageSize.width * largestResult.imageSize.height) /
    (smallestResult.imageSize.width * smallestResult.imageSize.height);
  const timeRatio = largestResult.winnerTime / smallestResult.winnerTime;

  console.log(
    `Size increase: ${sizeRatio.toFixed(1)}x (${smallestResult.imageSize.name} → ${largestResult.imageSize.name})`
  );
  console.log(`Time increase: ${timeRatio.toFixed(1)}x`);
  console.log(
    `Scaling efficiency: ${(sizeRatio / timeRatio).toFixed(2)} (closer to 1.0 is better)`
  );
})();
