// Fetches a nested promise value, refetching if the object path changes during resolution.
function getParent(obj, keys) {
    const parentKeys = keys.slice(0, -1);
    return parentKeys.reduce((acc, key) => acc?.[key], obj);
}
export async function fetchRacedPromiseValue(obj, ...keys) {
    const lastKey = keys[keys.length - 1];
    const parent = getParent(obj, keys);
    const promise = parent?.[lastKey];
    const val = await promise;
    const currentParent = getParent(obj, keys);
    if (parent !== currentParent || promise !== currentParent?.[lastKey]) {
        return fetchRacedPromiseValue(obj, ...keys);
    }
    return val;
}
