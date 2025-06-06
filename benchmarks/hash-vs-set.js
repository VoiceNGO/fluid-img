// hash & null hash tie

// Object Hash vs Set Performance Comparison
(() => {
  const ARRAY_SIZE = 1000000;
  const LOOKUP_SIZE = 100000;
  const ITERATIONS = 1000;

  const items = Array.from({ length: ARRAY_SIZE }, (_, i) => i);
  const lookupItems = items.slice(0, LOOKUP_SIZE);

  const objectHash = {};
  for (const item of items) objectHash[item] = true;

  const objectHashNull = Object.create(null);
  for (const item of items) objectHashNull[item] = true;

  const set = new Set(items);

  function benchmark(name, fn) {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      fn();
    }
    const end = performance.now();
    const avgTime = (end - start) / ITERATIONS;
    console.log(`${name}: ${avgTime.toFixed(3)}ms avg`);
    return avgTime;
  }

  console.log('🔍 Object Hash vs Set Performance Comparison');

  const objectTime = benchmark('Object hash', () => {
    let found = 0;
    for (const item of lookupItems) {
      if (objectHash[item]) found++;
    }
  });

  const objectNullTime = benchmark('Object hash (null prototype)', () => {
    let found = 0;
    for (const item of lookupItems) {
      if (objectHashNull[item]) found++;
    }
  });

  const setTime = benchmark('Set', () => {
    let found = 0;
    for (const item of lookupItems) {
      if (set.has(item)) found++;
    }
  });

  // Store results in an array and sort
  const results = [
    [objectTime, 'Object hash'],
    [objectNullTime, 'Object hash (null prototype)'],
    [setTime, 'Set'],
  ].sort((a, b) => a[0] - b[0]);

  console.log('\n📈 Results (sorted by time):');
  const winner = results[0][0];
  results.forEach(([time, name], index) => {
    if (index === 0) {
      console.log(`${name}: ${time.toFixed(3)}ms (winner)`);
    } else {
      const ratio = (time / winner).toFixed(1);
      console.log(`${name}: ${time.toFixed(3)}ms (${ratio}x slower)`);
    }
  });
})();
