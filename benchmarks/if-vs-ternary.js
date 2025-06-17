// An if statement vs. ternary operator performance benchmark.
(() => {
  const DATA_SIZE = 1_000_000;
  const ITERATIONS = 100;

  // Create test data with unpredictable values to prevent JIT optimizations
  // based on predictable branching.
  const testData = new Array(DATA_SIZE);
  for (let i = 0; i < DATA_SIZE; i++) {
    testData[i] = {
      swap: Math.random() > 0.5,
      ix: Math.floor(Math.random() * 1000),
    };
  }

  function testWithIf() {
    const seam = new Array(DATA_SIZE);
    let lastX = 0;

    for (let y = 0; y < DATA_SIZE; y++) {
      const { swap, ix } = testData[y];
      if (swap) {
        seam[y] = lastX = ix % 2 ? ix - 1 : ix + 1;
      } else {
        seam[y] = lastX = ix;
      }
    }
    return seam; // Return result to prevent dead code elimination
  }

  function testWithTernary() {
    const seam = new Array(DATA_SIZE);
    let lastX = 0;

    for (let y = 0; y < DATA_SIZE; y++) {
      const { swap, ix } = testData[y];
      seam[y] = lastX = swap ? (ix % 2 ? ix - 1 : ix + 1) : ix;
    }
    return seam; // Return result to prevent dead code elimination
  }

  function benchmark(name, fn, iterations = ITERATIONS) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = performance.now();
    const avgTime = (end - start) / iterations;
    console.log(`${name}: ${avgTime.toFixed(3)}ms avg`);
    return avgTime;
  }

  console.log(
    `Starting complex 'if' vs 'ternary' benchmark (${DATA_SIZE.toLocaleString()} elements, ${ITERATIONS} iterations)...`
  );

  const ifTime = benchmark('Complex If statement', testWithIf);
  const ternaryTime = benchmark('Complex Ternary operator', testWithTernary);

  // Store results and sort
  const results = [
    [ifTime, 'Complex If statement'],
    [ternaryTime, 'Complex Ternary operator'],
  ].sort((a, b) => a[0] - b[0]);

  console.log('\nResults (sorted by time):');
  const winner = results[0][0];
  results.forEach(([time, name], index) => {
    if (index === 0) {
      console.log(`${name}: ${time.toFixed(3)}ms (winner)`);
    } else {
      const ratio = (time / winner).toFixed(2);
      const improvement = (((time - winner) / time) * 100).toFixed(1);
      console.log(
        `${name}: ${time.toFixed(3)}ms (${ratio}x slower, ${improvement}% improvement possible)`
      );
    }
  });
})();
