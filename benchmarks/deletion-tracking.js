// Deletion Tracking Performance Comparison
{
  const ARRAY_SIZE = 1048576;
  const INDICES_TO_DELETE = Array.from({ length: 1024 }, () =>
    Math.floor(Math.random() * ARRAY_SIZE)
  );

  function benchmark(name, fn, iterations = 50) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = performance.now();
    const avgTime = (end - start) / iterations;
    console.log(`${name}: ${avgTime.toFixed(2)}ms avg`);
    return avgTime;
  }

  console.log('Deletion tracking benchmark...');

  const uint8Time = benchmark('Uint8Array', () => {
    const deleted = new Uint8Array(ARRAY_SIZE);
    for (const index of INDICES_TO_DELETE) {
      deleted[index] = 1;
    }
    // Check all
    let count = 0;
    for (let i = 0; i < ARRAY_SIZE; i++) {
      if (deleted[i]) count++;
    }
  });

  const boolTime = benchmark('Boolean Array', () => {
    const deleted = new Array(ARRAY_SIZE).fill(false);
    for (const index of INDICES_TO_DELETE) {
      deleted[index] = true;
    }
    // Check all
    let count = 0;
    for (let i = 0; i < ARRAY_SIZE; i++) {
      if (deleted[i]) count++;
    }
  });

  const setTime = benchmark('Set', () => {
    const deleted = new Set();
    for (const index of INDICES_TO_DELETE) {
      deleted.add(index);
    }
    // Check all
    let count = 0;
    for (let i = 0; i < ARRAY_SIZE; i++) {
      if (deleted.has(i)) count++;
    }
  });

  const objTime = benchmark('Object hash', () => {
    const deleted = {};
    for (const index of INDICES_TO_DELETE) {
      deleted[index] = true;
    }
    // Check all
    let count = 0;
    for (let i = 0; i < ARRAY_SIZE; i++) {
      if (deleted[i]) count++;
    }
  });

  // Store results in an array and sort
  const results = [
    [uint8Time, 'Uint8Array'],
    [boolTime, 'Boolean Array'],
    [setTime, 'Set'],
    [objTime, 'Object hash'],
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
