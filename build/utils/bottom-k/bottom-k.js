function quickSelect(arr, key, k) {
    function partition(arr, low, high, pivotIndex) {
        const pivotValue = arr[pivotIndex][key];
        [arr[pivotIndex], arr[high]] = [arr[high], arr[pivotIndex]];
        let storeIndex = low;
        for (let i = low; i < high; i++) {
            if (arr[i][key] < pivotValue) {
                [arr[i], arr[storeIndex]] = [arr[storeIndex], arr[i]];
                storeIndex++;
            }
        }
        [arr[storeIndex], arr[high]] = [arr[high], arr[storeIndex]];
        return storeIndex;
    }
    function select(arr, low, high, k) {
        if (low === high)
            return arr[low];
        const pivotIndex = low + Math.floor(Math.random() * (high - low + 1));
        const pivotNewIndex = partition(arr, low, high, pivotIndex);
        if (k === pivotNewIndex) {
            return arr[k];
        }
        else if (k < pivotNewIndex) {
            return select(arr, low, pivotNewIndex - 1, k);
        }
        else {
            return select(arr, pivotNewIndex + 1, high, k);
        }
    }
    return select(arr, 0, arr.length - 1, k - 1);
}
export function bottomKObjects(arr, key, k) {
    const KthElement = quickSelect(arr, key, k);
    const bottomK = arr
        .filter((el) => el[key] <= KthElement[key])
        .sort((a, b) => a[key] - b[key]);
    while (bottomK.length > k)
        bottomK.pop();
    return bottomK;
}
