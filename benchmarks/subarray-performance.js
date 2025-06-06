// Subarrays oddly win

// Subarray Performance Test
{
  const fullArray = new Uint16Array(2000000);
  for (let i = 0; i < fullArray.length; i++) {
    fullArray[i] = i;
  }

  const subArray = fullArray.subarray(0, 1000000);

  function benchmark(name, fn, iterations = 100) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = performance.now();
    const avgTime = (end - start) / iterations;
    console.log(`${name}: ${avgTime.toFixed(2)}ms avg`);
    return avgTime;
  }

  console.log('Subarray vs Full Array Performance Test');

  const fullTime = benchmark('Full array access', () => {
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += fullArray[i];
    }
  });

  const subTime = benchmark('Subarray access', () => {
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += subArray[i];
    }
  });

  // Store results in an array and sort
  const results = [
    [fullTime, 'Full array access'],
    [subTime, 'Subarray access'],
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
