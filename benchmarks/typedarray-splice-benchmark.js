(() => {
  const ARRAY_INITIAL_SIZE = 1_000_000;
  const ELEMENTS_TO_REMOVE_COUNT = 10_000;
  const BENCHMARK_ITERATIONS = 1;

  function customSplice(ary, ix) {
    const newArray = new ary.constructor(ary.length - 1);
    newArray.set(ary.subarray(0, ix), 0);
    newArray.set(ary.subarray(ix + 1), ix);
    return newArray;
  }

  const baseJsArray = new Array(ARRAY_INITIAL_SIZE);
  const baseTypedArray = new Uint32Array(ARRAY_INITIAL_SIZE);
  for (let i = 0; i < ARRAY_INITIAL_SIZE; i++) {
    baseJsArray[i] = i;
    baseTypedArray[i] = i;
  }

  const indicesSet = new Set();
  while (indicesSet.size < ELEMENTS_TO_REMOVE_COUNT) {
    indicesSet.add(Math.floor(Math.random() * ARRAY_INITIAL_SIZE));
  }
  const indicesToRemoveDesc = Array.from(indicesSet).sort((a, b) => b - a);

  function benchmarkOperations(name, coreLogicFn, iterations = BENCHMARK_ITERATIONS) {
    let totalTime = 0;
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      coreLogicFn();
      const end = performance.now();
      totalTime += end - start;
    }
    const avgTime = totalTime / iterations;
    console.log(`${name}: ${avgTime.toFixed(2)}ms for ${ELEMENTS_TO_REMOVE_COUNT} removals`);
    return avgTime;
  }

  function runJsArraySpliceTest() {
    let workingJsArray = Array.from(baseJsArray);
    for (const index of indicesToRemoveDesc) {
      workingJsArray.splice(index, 1);
    }
  }

  function runCustomTypedArraySpliceTest() {
    let workingTypedArray = new Uint32Array(baseTypedArray);
    for (const index of indicesToRemoveDesc) {
      workingTypedArray = customSplice(workingTypedArray, index);
    }
  }

  console.log(
    `Benchmark: ${ELEMENTS_TO_REMOVE_COUNT} removals from ${ARRAY_INITIAL_SIZE} elements.`
  );

  const jsTime = benchmarkOperations('Array.prototype.splice on JS Array', runJsArraySpliceTest);

  const customTime = benchmarkOperations(
    'Custom splice on Uint32Array',
    runCustomTypedArraySpliceTest
  );

  if (jsTime !== undefined && customTime !== undefined && jsTime > 0 && customTime > 0) {
    const factor = customTime / jsTime;
    console.log(`Custom splice was ${factor.toFixed(1)}x the duration of Array.prototype.splice.`);
  } else {
    console.log('Could not calculate relative performance.');
  }
})();
