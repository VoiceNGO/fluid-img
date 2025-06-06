// forEach vs for loop benchmark
(() => {
  const SMALL_SIZE = 1000;
  const LARGE_SIZE = 1_000_000;

  // Generate test data
  const smallArray = new Array(SMALL_SIZE);
  const largeArray = new Array(LARGE_SIZE);

  for (let i = 0; i < SMALL_SIZE; i++) {
    smallArray[i] = Math.random() * 100;
  }

  for (let i = 0; i < LARGE_SIZE; i++) {
    largeArray[i] = Math.random() * 100;
  }

  // Test functions for small array
  function forLoopSmall() {
    let sum = 0;
    for (let i = 0; i < smallArray.length; i++) {
      sum += smallArray[i];
    }
    return sum;
  }

  function forEachSmall() {
    let sum = 0;
    smallArray.forEach((val) => {
      sum += val;
    });
    return sum;
  }

  function forOfSmall() {
    let sum = 0;
    for (const val of smallArray) {
      sum += val;
    }
    return sum;
  }

  function forLoopCachedSmall() {
    let sum = 0;
    const len = smallArray.length;
    for (let i = 0; i < len; i++) {
      sum += smallArray[i];
    }
    return sum;
  }

  // Test functions for large array
  function forLoopLarge() {
    let sum = 0;
    for (let i = 0; i < largeArray.length; i++) {
      sum += largeArray[i];
    }
    return sum;
  }

  function forEachLarge() {
    let sum = 0;
    largeArray.forEach((val) => {
      sum += val;
    });
    return sum;
  }

  function forOfLarge() {
    let sum = 0;
    for (const val of largeArray) {
      sum += val;
    }
    return sum;
  }

  function forLoopCachedLarge() {
    let sum = 0;
    const len = largeArray.length;
    for (let i = 0; i < len; i++) {
      sum += largeArray[i];
    }
    return sum;
  }

  function benchmark(name, fn, iterations = 10) {
    const start = performance.now();
    let result;
    for (let i = 0; i < iterations; i++) {
      result = fn();
    }
    const end = performance.now();
    const avgTime = (end - start) / iterations;
    console.log(`${name}: ${avgTime.toFixed(3)}ms avg (result: ${result?.toFixed(2)})`);
    return avgTime;
  }

  function runBenchmarkGroup(title, benchmarks) {
    console.log(`\n=== ${title} ===`);

    const results = benchmarks
      .map(([name, fn, iterations = 10]) => {
        const time = benchmark(name, fn, iterations);
        return [time, name];
      })
      .sort((a, b) => a[0] - b[0]);

    console.log('\nResults (sorted by time):');
    const winner = results[0][0];
    results.forEach(([time, name], index) => {
      if (index === 0) {
        console.log(`${name}: ${time.toFixed(3)}ms (winner)`);
      } else {
        const ratio = (time / winner).toFixed(1);
        const improvement = (((time - winner) / time) * 100).toFixed(1);
        console.log(
          `${name}: ${time.toFixed(3)}ms (${ratio}x slower, ${improvement}% improvement possible)`
        );
      }
    });
  }

  console.log('Starting forEach vs for loop benchmark...');

  runBenchmarkGroup(`Small Array (${SMALL_SIZE.toLocaleString()} elements)`, [
    ['for loop', () => forLoopSmall(), 10000],
    ['forEach', () => forEachSmall(), 10000],
    ['for...of', () => forOfSmall(), 10000],
    ['for loop (cached length)', () => forLoopCachedSmall(), 10000],
  ]);

  runBenchmarkGroup(`Large Array (${LARGE_SIZE.toLocaleString()} elements)`, [
    ['for loop', forLoopLarge],
    ['forEach', forEachLarge],
    ['for...of', forOfLarge],
    ['for loop (cached length)', forLoopCachedLarge],
  ]);
})();
