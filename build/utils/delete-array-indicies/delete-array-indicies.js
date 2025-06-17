export function deleteArrayIndices(array, uniqueSortedIndicesToRemove, elementsPerRemoval = 1) {
    const newSize = array.length - uniqueSortedIndicesToRemove.length * elementsPerRemoval;
    const ArrayConstructor = array.constructor;
    const result = new ArrayConstructor(newSize);
    let resultOffset = 0;
    let sourceStart = 0;
    let lastIndex = -1;
    for (const deleteIndex of uniqueSortedIndicesToRemove) {
        if (lastIndex === deleteIndex) {
            throw new Error('[deleteArrayIndices]: Duplicate index detected');
        }
        if (lastIndex > deleteIndex) {
            throw new Error('[deleteArrayIndices]: Indices are not sorted');
        }
        const chunkSize = deleteIndex - sourceStart;
        if (chunkSize > 0) {
            result.set(array.subarray(sourceStart, deleteIndex), resultOffset);
            resultOffset += chunkSize;
        }
        sourceStart = deleteIndex + elementsPerRemoval;
        lastIndex = deleteIndex;
    }
    if (sourceStart < array.length) {
        result.set(array.subarray(sourceStart), resultOffset);
    }
    return result;
}
