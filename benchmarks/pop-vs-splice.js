function timeFn(fn, description = fn.name) {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${description}: ${(end - start).toFixed(2)}ms`);
}

function benchmarkPop(arr) {
  for (let i = 0; i < 1000000; i++) {
    arr.pop();
  }
}

function benchmarkSplice(arr) {
  for (let i = 999999; i >= 0; i--) {
    arr.splice(i);
  }
}

const arr = Array.from({ length: 1000000 }, (_, i) => i);
const arr2 = [...arr];
timeFn(() => benchmarkPop(arr), 'pop');
timeFn(() => benchmarkSplice(arr2), 'splice');
