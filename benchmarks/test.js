function quickSelect(arr) {
  const k = arr.length;

  function partition(arr, low, high, pivotIndex) {
    const pivotValue = arr[pivotIndex];
    [arr[pivotIndex], arr[high]] = [arr[high], arr[pivotIndex]];
    let storeIndex = low;
    for (let i = low; i < high; i++) {
      if (arr[i] < pivotValue) {
        [arr[i], arr[storeIndex]] = [arr[storeIndex], arr[i]];
        storeIndex++;
      }
    }
    [arr[storeIndex], arr[high]] = [arr[high], arr[storeIndex]];
    return storeIndex;
  }

  function select(arr, low, high, k) {
    if (low === high) return arr[low];
    const pivotIndex = low + Math.floor(Math.random() * (high - low + 1));
    const pivotNewIndex = partition(arr, low, high, pivotIndex);

    if (k === pivotNewIndex) {
      return arr[k];
    } else if (k < pivotNewIndex) {
      return select(arr, low, pivotNewIndex - 1, k);
    } else {
      return select(arr, pivotNewIndex + 1, high, k);
    }
  }
  select(arr, 0, arr.length - 1, k - 1);
}

const arr = new Array(1000000).fill(0).map(() => Math.random());
const copied1 = [...arr];
const copied2 = [...arr];

const start = performance.now();
quickSelect(copied1, 1000);
const end = performance.now();
console.log(`Quickselect took ${end - start}ms`);

const start2 = performance.now();
copied2.sort((a, b) => a - b);
const end2 = performance.now();
console.log(`Sort took ${end2 - start2}ms`);

console.log(copied1.slice(0, 100));
console.log(copied2.slice(0, 100));
