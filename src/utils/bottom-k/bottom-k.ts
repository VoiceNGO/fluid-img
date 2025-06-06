function quickSelect<Key extends string, ObjType extends Record<Key, number>>(
  arr: ObjType[],
  key: Key,
  k: number
): ObjType {
  function partition(arr: ObjType[], low: number, high: number, pivotIndex: number): number {
    const pivotValue = arr[pivotIndex]![key]!;
    [arr[pivotIndex], arr[high]] = [arr[high]!, arr[pivotIndex]!];
    let storeIndex = low;
    for (let i = low; i < high; i++) {
      if (arr[i]![key]! < pivotValue) {
        [arr[i], arr[storeIndex]] = [arr[storeIndex]!, arr[i]!];
        storeIndex++;
      }
    }
    [arr[storeIndex], arr[high]] = [arr[high]!, arr[storeIndex]!];
    return storeIndex;
  }

  function select(arr: ObjType[], low: number, high: number, k: number): ObjType {
    if (low === high) return arr[low]!;
    const pivotIndex = low + Math.floor(Math.random() * (high - low + 1));
    const pivotNewIndex = partition(arr, low, high, pivotIndex);

    if (k === pivotNewIndex) {
      return arr[k]!;
    } else if (k < pivotNewIndex) {
      return select(arr, low, pivotNewIndex - 1, k);
    } else {
      return select(arr, pivotNewIndex + 1, high, k);
    }
  }

  return select(arr, 0, arr.length - 1, k - 1);
}

export function bottomKObjects<Key extends string, ObjType extends Record<Key, number>>(
  arr: ObjType[],
  key: Key,
  k: number
): ObjType[] {
  const KthElement = quickSelect(arr, key, k);
  const bottomK = arr
    .filter((el: ObjType) => el[key]! <= KthElement[key]!)
    .sort((a: ObjType, b: ObjType) => a[key]! - b[key]!);
  while (bottomK.length > k) bottomK.pop();
  return bottomK;
}
