import type { Get } from 'type-fest';

// Fetches a nested promise value, refetching if the object path changes during resolution.

function getParent(obj: object, keys: readonly string[]): any {
  const parentKeys = keys.slice(0, -1);

  return parentKeys.reduce((acc: any, key) => acc?.[key], obj);
}

export async function fetchRacedPromiseValue<
  T extends object,
  P extends readonly [string, ...string[]],
>(obj: T, ...keys: Get<T, P> extends Promise<any> ? P : never): Promise<Awaited<Get<T, P>>> {
  const lastKey = keys[keys.length - 1]!;

  const parent = getParent(obj, keys);
  const promise = parent?.[lastKey];

  const val = await promise;

  const currentParent = getParent(obj, keys);

  if (parent !== currentParent || promise !== currentParent?.[lastKey]) {
    return fetchRacedPromiseValue(obj, ...(keys as any)) as any;
  }

  return val;
}
