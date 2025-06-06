import { describe, test, expect } from 'vitest';
import { bottomKObjects } from './bottom-k';

describe('bottomKObjects', () => {
  const key = 'value';

  const toValueObjects = (numbers: number[]) => numbers.map((n) => ({ [key]: n }));

  test('should return the k smallest elements in sorted order', () => {
    const arr = toValueObjects([5, 2, 8, 1, 9, 3]);
    const result = bottomKObjects(arr, key, 3);
    expect(result).toEqual(toValueObjects([1, 2, 3]));
  });

  test('should handle duplicate values correctly', () => {
    const arr = toValueObjects([3, 1, 4, 1, 5, 9, 2, 6, 5, 3]);
    const result = bottomKObjects(arr, key, 4);
    expect(result).toEqual(toValueObjects([1, 1, 2, 3]));
  });

  test('should return all elements when k equals array length', () => {
    const arr = toValueObjects([3, 1, 4, 2]);
    const result = bottomKObjects(arr, key, 4);
    expect(result).toEqual(toValueObjects([1, 2, 3, 4]));
  });

  test('should return single element when k is 1', () => {
    const arr = toValueObjects([5, 2, 8, 1, 9]);
    const result = bottomKObjects(arr, key, 1);
    expect(result).toEqual(toValueObjects([1]));
  });

  test('should handle array with one element', () => {
    const arr = toValueObjects([42]);
    const result = bottomKObjects(arr, key, 1);
    expect(result).toEqual(toValueObjects([42]));
  });

  test('should handle negative numbers', () => {
    const arr = toValueObjects([-3, -1, -4, -2, 0, 1]);
    const result = bottomKObjects(arr, key, 3);
    expect(result).toEqual(toValueObjects([-4, -3, -2]));
  });

  test('should handle larger k values correctly', () => {
    const arr = toValueObjects([10, 20, 30, 40, 50]);
    const result = bottomKObjects(arr, key, 5);
    expect(result).toEqual(toValueObjects([10, 20, 30, 40, 50]));
  });

  test('should maintain sorted order in result', () => {
    const arr = toValueObjects([9, 1, 8, 2, 7, 3, 6, 4, 5]);
    const result = bottomKObjects(arr, key, 6);
    expect(result).toEqual(toValueObjects([1, 2, 3, 4, 5, 6]));

    // Verify the result is sorted
    for (let i = 1; i < result.length; i++) {
      expect(result[i]![key]).toBeGreaterThanOrEqual(result[i - 1]![key]);
    }
  });

  test('should handle zero values', () => {
    const arr = toValueObjects([0, -1, 1, 0, 2, -2]);
    const result = bottomKObjects(arr, key, 4);
    expect(result).toEqual(toValueObjects([-2, -1, 0, 0]));
  });

  test('should work with decimal numbers', () => {
    const arr = toValueObjects([3.14, 2.71, 1.41, 1.73, 2.23]);
    const result = bottomKObjects(arr, key, 3);
    expect(result).toEqual(toValueObjects([1.41, 1.73, 2.23]));
  });
});
