// Benchmark: splice(length - 1) vs pop() performance
// Testing 1M operations on 1M element arrays

function createArray(size) {
  return Array.from({ length: size }, (_, i) => i);
}

function benchmarkPop() {
  console.log('Benchmarking pop()...');
  const arr = createArray(1000000);

  const start = performance.now();

  for (let i = 0; i < 1000000; i++) {
    if (arr.length === 0) {
      // Refill array when empty
      arr.push(...createArray(1000));
    }
    arr.pop();
  }

  const end = performance.now();
  return end - start;
}

function benchmarkSplice() {
  console.log('Benchmarking splice(length - 1)...');
  const arr = createArray(1000000);

  const start = performance.now();

  for (let i = 0; i < 1000000; i++) {
    if (arr.length === 0) {
      // Refill array when empty
      arr.push(...createArray(1000));
    }
    arr.splice(arr.length - 1, 1);
  }

  const end = performance.now();
  return end - start;
}

function runBenchmark() {
  console.log('Starting benchmark...');
  console.log('Array size: 1,000,000 elements');
  console.log('Operations: 1,000,000 per method');
  console.log('');

  // Warm up BOTH methods
  console.log('Warming up both methods...');
  const warmupArr1 = createArray(1000);
  const warmupArr2 = createArray(1000);

  // Warm up pop()
  for (let i = 0; i < 500; i++) {
    if (warmupArr1.length > 0) warmupArr1.pop();
  }

  // Warm up splice()
  for (let i = 0; i < 500; i++) {
    if (warmupArr2.length > 0) warmupArr2.splice(warmupArr2.length - 1, 1);
  }

  // Randomize execution order to avoid bias
  const runFirst = Math.random() < 0.5 ? 'pop' : 'splice';
  let popTime, spliceTime;

  if (runFirst === 'pop') {
    popTime = benchmarkPop();
    spliceTime = benchmarkSplice();
  } else {
    spliceTime = benchmarkSplice();
    popTime = benchmarkPop();
  }

  console.log('');
  console.log('=== RESULTS ===');
  console.log(`pop(): ${popTime.toFixed(2)}ms`);
  console.log(`splice(length - 1): ${spliceTime.toFixed(2)}ms`);
  console.log('');

  const ratio = spliceTime / popTime;
  if (popTime < spliceTime) {
    console.log(`🏆 pop() is ${ratio.toFixed(2)}x faster than splice()`);
  } else {
    console.log(`🏆 splice() is ${(1 / ratio).toFixed(2)}x faster than pop()`);
  }

  console.log('');
  console.log('Performance difference:', `${Math.abs(spliceTime - popTime).toFixed(2)}ms`);
  console.log(
    'Percentage difference:',
    `${((Math.abs(spliceTime - popTime) / Math.min(spliceTime, popTime)) * 100).toFixed(1)}%`
  );
}

// Run the benchmark
runBenchmark();
