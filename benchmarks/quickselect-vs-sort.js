function quickSelect(arr, k) {
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

  return select(arr, 0, arr.length - 1, k - 1);
}

function quickSelectButtomK(arr, k) {
  const KthElement = quickSelect(arr, k);
  const bottomK = arr.filter((el) => el <= KthElement);
  return bottomK.sort((a, b) => a - b);
}

function sortAndPickBottomK(arr, k) {
  const sorted = arr.sort((a, b) => a - b);
  return sorted.slice(0, k);
}

function timeFn(fn) {
  const start = performance.now();
  const val = fn();
  const end = performance.now();
  return { val, time: end - start };
}

const arr = new Array(1_000_000).fill(0).map(() => Math.random());
const copied1 = [...arr];
const copied2 = [...arr];

const quickSelectBottomKTimeResult = timeFn(() => quickSelectButtomK(copied1, 100_000));
const sortAndPickBottomKTimeResult = timeFn(() => sortAndPickBottomK(copied2, 100_000));

const valuesAreEqual =
  JSON.stringify(quickSelectBottomKTimeResult.val.sort((a, b) => a - b)) ===
  JSON.stringify(sortAndPickBottomKTimeResult.val);

if (!valuesAreEqual) {
  console.error('Values are not equal');
}

console.log(`Quickselect bottom K: ${quickSelectBottomKTimeResult.time}ms`);
console.log(`Sort and pick bottom K: ${sortAndPickBottomKTimeResult.time}ms`);
