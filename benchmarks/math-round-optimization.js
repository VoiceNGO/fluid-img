// Math.round() optimization benchmark
(() => {
  const ITERATIONS = 10_000_000;

  // Generate test data
  const testData = new Array(ITERATIONS);
  for (let i = 0; i < ITERATIONS; i++) {
    testData[i] = (Math.random() - 0.5) * 1000; // Range from -500 to 500
  }

  // Individual rounding functions
  function customRoundFloorCeil(x) {
    return x >= 0 ? Math.floor(x + 0.5) : Math.ceil(x - 0.5);
  }

  function customRoundBitwise(x) {
    return (x + (x >= 0 ? 0.5 : -0.5)) | 0;
  }

  function customRoundTrunc(x) {
    return Math.trunc(x + (x >= 0 ? 0.5 : -0.5));
  }

  function customRoundSimple(x) {
    return x < 0 ? Math.ceil(x - 0.5) : Math.floor(x + 0.5);
  }

  function customRoundModulo(x) {
    const c = x % 1;
    return x - c + ((c + 1.5) >> 1);
  }

  function benchmarkRoundingFunction(name, roundFn, iterations = 5) {
    const start = performance.now();
    let result = 0;
    for (let iter = 0; iter < iterations; iter++) {
      let sum = 0;
      for (let i = 0; i < testData.length; i++) {
        sum += roundFn(testData[i]);
      }
      result = sum;
    }
    const end = performance.now();
    const avgTime = (end - start) / iterations;
    console.log(`${name}: ${avgTime.toFixed(2)}ms avg (result: ${result})`);
    return avgTime;
  }

  console.log(`Starting Math.round() benchmark (${ITERATIONS.toLocaleString()} operations)...`);

  const mathRoundTime = benchmarkRoundingFunction('Math.round()', Math.round);
  const floorCeilTime = benchmarkRoundingFunction('Custom Floor/Ceil', customRoundFloorCeil);
  const bitwiseTime = benchmarkRoundingFunction('Custom Bitwise', customRoundBitwise);
  const truncTime = benchmarkRoundingFunction('Custom Math.trunc', customRoundTrunc);
  const simpleTime = benchmarkRoundingFunction('Custom Simple', customRoundSimple);
  const moduloTime = benchmarkRoundingFunction('Custom Modulo', customRoundModulo);

  // Store results and sort
  const results = [
    [mathRoundTime, 'Math.round()'],
    [floorCeilTime, 'Custom Floor/Ceil'],
    [bitwiseTime, 'Custom Bitwise'],
    [truncTime, 'Custom Math.trunc'],
    [simpleTime, 'Custom Simple'],
    [moduloTime, 'Custom Modulo'],
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

  // Verify correctness
  console.log('\nVerifying correctness with sample values:');
  const testValues = [4.4, 4.5, 4.6, -4.4, -4.5, -4.6, 0, 0.5, -0.5];
  testValues.forEach((val) => {
    const mathResult = Math.round(val);
    const bitwiseResult = customRoundBitwise(val);
    const moduloResult = customRoundModulo(val);

    console.log(
      `${val}: Math.round=${mathResult}, Bitwise=${bitwiseResult}, Modulo=${moduloResult} ${mathResult === bitwiseResult ? '✓' : '✗'} ${mathResult === moduloResult ? '✓' : '✗'}`
    );
  });
})();
