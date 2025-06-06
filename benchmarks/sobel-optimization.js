// Sobel edge detection optimization benchmark
(() => {
  const WIDTH = 1000;
  const HEIGHT = 1000;
  const ITERATIONS = 10;

  // Create test data
  function createTestData() {
    const data = new Array(HEIGHT);
    for (let y = 0; y < HEIGHT; y++) {
      data[y] = new Uint8Array(WIDTH);
      for (let x = 0; x < WIDTH; x++) {
        data[y][x] = Math.floor(Math.random() * 256);
      }
    }
    return data;
  }

  const testData = createTestData();

  function sobelDirectIndexing(grayscaleMap) {
    const result = new Array(HEIGHT);

    for (let y = 0; y < HEIGHT; y++) {
      result[y] = new Uint8Array(WIDTH);
      for (let x = 0; x < WIDTH; x++) {
        // Clamp coordinates to image bounds
        const x1 = Math.max(0, x - 1);
        const x2 = x;
        const x3 = Math.min(WIDTH - 1, x + 1);
        const y1 = Math.max(0, y - 1);
        const y2 = y;
        const y3 = Math.min(HEIGHT - 1, y + 1);

        const gx =
          -grayscaleMap[y1][x1] +
          grayscaleMap[y1][x3] +
          -grayscaleMap[y2][x1] * 2 +
          grayscaleMap[y2][x3] * 2 +
          -grayscaleMap[y3][x1] +
          grayscaleMap[y3][x3];

        const gy =
          -grayscaleMap[y1][x1] +
          -grayscaleMap[y1][x2] * 2 +
          -grayscaleMap[y1][x3] +
          grayscaleMap[y3][x1] +
          grayscaleMap[y3][x2] * 2 +
          grayscaleMap[y3][x3];

        const totalEnergy = Math.abs(gx) + Math.abs(gy);
        const normalizedEnergy = Math.round(totalEnergy / 8);
        result[y][x] = Math.max(0, Math.min(255, normalizedEnergy));
      }
    }
    return result;
  }

  function sobelCachedRows(grayscaleMap) {
    const result = new Array(HEIGHT);

    for (let y = 0; y < HEIGHT; y++) {
      result[y] = new Uint8Array(WIDTH);

      // Cache row references with clamping
      const y1 = Math.max(0, y - 1);
      const y3 = Math.min(HEIGHT - 1, y + 1);
      const prevRow = grayscaleMap[y1];
      const currentRow = grayscaleMap[y];
      const nextRow = grayscaleMap[y3];

      for (let x = 0; x < WIDTH; x++) {
        // Clamp column coordinates
        const x1 = Math.max(0, x - 1);
        const x3 = Math.min(WIDTH - 1, x + 1);

        const gx =
          -prevRow[x1] +
          prevRow[x3] +
          -currentRow[x1] * 2 +
          currentRow[x3] * 2 +
          -nextRow[x1] +
          nextRow[x3];

        const gy =
          -prevRow[x1] +
          -prevRow[x] * 2 +
          -prevRow[x3] +
          nextRow[x1] +
          nextRow[x] * 2 +
          nextRow[x3];

        const totalEnergy = Math.abs(gx) + Math.abs(gy);
        result[y][x] = totalEnergy >> 3;
      }
    }
    return result;
  }

  function sobelMicroOptimized(grayscaleMap) {
    const result = new Array(HEIGHT);

    for (let y = 0; y < HEIGHT; y++) {
      result[y] = new Uint8Array(WIDTH);

      // Cache row references with clamping
      const y1 = Math.max(0, y - 1);
      const y3 = Math.min(HEIGHT - 1, y + 1);
      const prevRow = grayscaleMap[y1];
      const currentRow = grayscaleMap[y];
      const nextRow = grayscaleMap[y3];
      const resultRow = result[y];

      for (let x = 0; x < WIDTH; x++) {
        // Clamp column coordinates
        const x1 = Math.max(0, x - 1);
        const x3 = Math.min(WIDTH - 1, x + 1);

        // Pre-cache pixel values
        const p1 = prevRow[x1]; // top-left
        const p2 = prevRow[x]; // top-center
        const p3 = prevRow[x3]; // top-right
        const p4 = currentRow[x1]; // middle-left
        const p6 = currentRow[x3]; // middle-right
        const p7 = nextRow[x1]; // bottom-left
        const p8 = nextRow[x]; // bottom-center
        const p9 = nextRow[x3]; // bottom-right

        const gx = -p1 + p3 + ((-p4 + p6) << 1) + (-p7 + p9);
        const gy = -p1 - (p2 << 1) - p3 + p7 + (p8 << 1) + p9;

        const absGx = gx < 0 ? -gx : gx;
        const absGy = gy < 0 ? -gy : gy;
        const normalizedEnergy = (absGx + absGy) >> 3;
        resultRow[x] = normalizedEnergy > 255 ? 255 : normalizedEnergy;
      }
    }
    return result;
  }

  function sobelMicroOptimizedV2(grayscaleMap) {
    const result = new Array(HEIGHT);

    for (let y = 0; y < HEIGHT; y++) {
      result[y] = new Uint8Array(WIDTH);

      // Cache row references with clamping
      const y1 = Math.max(0, y - 1);
      const y3 = Math.min(HEIGHT - 1, y + 1);
      const prevRow = grayscaleMap[y1];
      const currentRow = grayscaleMap[y];
      const nextRow = grayscaleMap[y3];
      const resultRow = result[y];

      // Pre-compute first few pixels and initialize cache
      let cachedGxLeft, cachedGyLeft, nextCachedGxLeft, nextCachedGyLeft;

      {
        const x1 = 0,
          x3 = 1;
        const p1 = prevRow[x1],
          p2 = prevRow[0],
          p3 = prevRow[x3];
        const p4 = currentRow[x1],
          p6 = currentRow[x3];
        const p7 = nextRow[x1],
          p8 = nextRow[0],
          p9 = nextRow[x3];

        const gx = -p1 + p3 + ((-p4 + p6) << 1) + (-p7 + p9);
        const gy = -p1 - (p2 << 1) - p3 + p7 + (p8 << 1) + p9;

        resultRow[0] = ((gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy)) >> 3;
        cachedGxLeft = p3 + (p6 << 1) + p9;
        cachedGyLeft = -p3 + p9;
      }

      {
        const x1 = 0,
          x3 = 2;
        const p1 = prevRow[x1],
          p2 = prevRow[1],
          p3 = prevRow[x3];
        const p4 = currentRow[x1],
          p6 = currentRow[x3];
        const p7 = nextRow[x1],
          p8 = nextRow[1],
          p9 = nextRow[x3];

        const gx = -p1 + p3 + ((-p4 + p6) << 1) + (-p7 + p9);
        const gy = -p1 - (p2 << 1) - p3 + p7 + (p8 << 1) + p9;

        resultRow[1] = ((gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy)) >> 3;
        nextCachedGxLeft = p3 + (p6 << 1) + p9;
        nextCachedGyLeft = -p3 + p9;
      }

      // Main loop - cache is always available
      for (let x = 2; x < WIDTH; x++) {
        const x1 = Math.max(0, x - 1);
        const x3 = Math.min(WIDTH - 1, x + 1);

        const p2 = prevRow[x],
          p3 = prevRow[x3];
        const p4 = currentRow[x1],
          p6 = currentRow[x3];
        const p7 = nextRow[x1],
          p8 = nextRow[x],
          p9 = nextRow[x3];

        // Always use cached version - no branch!
        const gx = cachedGxLeft + ((-p4 + p6) << 1) + p3 + p9;
        const gy = cachedGyLeft - (p2 << 1) - p3 + p7 + (p8 << 1) + p9;

        // Shift cache
        cachedGxLeft = nextCachedGxLeft;
        cachedGyLeft = nextCachedGyLeft;
        nextCachedGxLeft = p3 + (p6 << 1) + p9;
        nextCachedGyLeft = -p3 + p9;

        const absGx = gx < 0 ? -gx : gx;
        const absGy = gy < 0 ? -gy : gy;
        resultRow[x] = (absGx + absGy) >> 3;
      }
    }
    return result;
  }

  function sobelMicroOptimizedV3(grayscaleMap) {
    const result = new Array(HEIGHT);

    function calculateSobel(x, y1, y3, prevRow, currentRow, nextRow) {
      const x1 = Math.max(0, x - 1);
      const x3 = Math.min(WIDTH - 1, x + 1);

      const p1 = prevRow[x1],
        p2 = prevRow[x],
        p3 = prevRow[x3];
      const p4 = currentRow[x1],
        p6 = currentRow[x3];
      const p7 = nextRow[x1],
        p8 = nextRow[x],
        p9 = nextRow[x3];

      const gx = -p1 + p3 + ((-p4 + p6) << 1) + (-p7 + p9);
      const gy = -p1 - (p2 << 1) - p3 + p7 + (p8 << 1) + p9;

      return ((gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy)) >> 3;
    }

    function calculateCacheValues(x, prevRow, currentRow, nextRow) {
      const x3 = Math.min(WIDTH - 1, x + 1);
      const p3 = prevRow[x3],
        p6 = currentRow[x3],
        p9 = nextRow[x3];
      return {
        gxLeft: p3 + (p6 << 1) + p9,
        gyLeft: -p3 + p9,
      };
    }

    for (let y = 0; y < HEIGHT; y++) {
      result[y] = new Uint8Array(WIDTH);

      // Cache row references with clamping
      const y1 = Math.max(0, y - 1);
      const y3 = Math.min(HEIGHT - 1, y + 1);
      const prevRow = grayscaleMap[y1];
      const currentRow = grayscaleMap[y];
      const nextRow = grayscaleMap[y3];
      const resultRow = result[y];

      // Pre-compute first few pixels and initialize cache
      let cachedGxLeft, cachedGyLeft, nextCachedGxLeft, nextCachedGyLeft;

      // Process x=0
      resultRow[0] = calculateSobel(0, y1, y3, prevRow, currentRow, nextRow);
      const cache0 = calculateCacheValues(0, prevRow, currentRow, nextRow);
      cachedGxLeft = cache0.gxLeft;
      cachedGyLeft = cache0.gyLeft;

      // Process x=1
      resultRow[1] = calculateSobel(1, y1, y3, prevRow, currentRow, nextRow);
      const cache1 = calculateCacheValues(1, prevRow, currentRow, nextRow);
      nextCachedGxLeft = cache1.gxLeft;
      nextCachedGyLeft = cache1.gyLeft;

      // Main loop - cache is always available
      for (let x = 2; x < WIDTH; x++) {
        const x1 = Math.max(0, x - 1);
        const x3 = Math.min(WIDTH - 1, x + 1);

        const p2 = prevRow[x],
          p3 = prevRow[x3];
        const p4 = currentRow[x1],
          p6 = currentRow[x3];
        const p7 = nextRow[x1],
          p8 = nextRow[x],
          p9 = nextRow[x3];

        // Always use cached version - no branch!
        const gx = cachedGxLeft + ((-p4 + p6) << 1) + p3 + p9;
        const gy = cachedGyLeft - (p2 << 1) - p3 + p7 + (p8 << 1) + p9;

        // Shift cache
        cachedGxLeft = nextCachedGxLeft;
        cachedGyLeft = nextCachedGyLeft;
        const cacheNext = calculateCacheValues(x, prevRow, currentRow, nextRow);
        nextCachedGxLeft = cacheNext.gxLeft;
        nextCachedGyLeft = cacheNext.gyLeft;

        const absGx = gx < 0 ? -gx : gx;
        const absGy = gy < 0 ? -gy : gy;
        resultRow[x] = (absGx + absGy) >> 3;
      }
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

  console.log(
    `Starting Sobel optimization benchmark (${WIDTH}x${HEIGHT}, ${ITERATIONS} iterations)...`
  );

  const directTime = benchmark('Direct array indexing', () => {
    sobelDirectIndexing(testData);
  });

  const cachedTime = benchmark('Cached row references', () => {
    sobelCachedRows(testData);
  });

  const microOptimizedTime = benchmark('Micro-optimized', () => {
    sobelMicroOptimized(testData);
  });

  const microOptimizedV2Time = benchmark('Micro-optimized V2', () => {
    sobelMicroOptimizedV2(testData);
  });

  const microOptimizedV3Time = benchmark('Micro-optimized V3', () => {
    sobelMicroOptimizedV3(testData);
  });

  // Store results and sort
  const results = [
    [directTime, 'Direct array indexing'],
    [cachedTime, 'Cached row references'],
    [microOptimizedTime, 'Micro-optimized'],
    [microOptimizedV2Time, 'Micro-optimized V2'],
    [microOptimizedV3Time, 'Micro-optimized V3'],
  ].sort((a, b) => a[0] - b[0]);

  console.log('\nResults (sorted by time):');
  const winner = results[0][0];
  results.forEach(([time, name], index) => {
    if (index === 0) {
      console.log(`${name}: ${time.toFixed(2)}ms (winner)`);
    } else {
      const ratio = (time / winner).toFixed(1);
      const improvement = (((time - winner) / time) * 100).toFixed(1);
      console.log(
        `${name}: ${time.toFixed(2)}ms (${ratio}x slower, ${improvement}% improvement possible)`
      );
    }
  });
})();
