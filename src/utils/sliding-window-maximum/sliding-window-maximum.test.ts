import { describe, it, expect } from 'vitest';
import { SlidingWindowMaximum } from './sliding-window-maximum';

describe('SlidingWindowMaximum', () => {
  const runTest = (
    windowSize: number,
    initialCapacity: number,
    valuesToAdd: number[],
    expectedMaximums: number[]
  ) => {
    const swm = new SlidingWindowMaximum(windowSize, initialCapacity, Uint32Array);
    valuesToAdd.forEach((value, index) => {
      const max = swm.addAndGetMax(value);
      expect(max).toBe(expectedMaximums[index]);
    });
  };

  it('should return the correct maximum in a simple ascending sequence', () => {
    const valuesToAdd = [1, 2, 3, 4, 5];
    const expectedMaximums = [1, 2, 3, 4, 5];
    runTest(5, 10, valuesToAdd, expectedMaximums);
  });

  it('should handle a sliding window where the max does not change', () => {
    const valuesToAdd = [1, 2, 3, 1, 2];
    const expectedMaximums = [1, 2, 3, 3, 3];
    runTest(3, 5, valuesToAdd, expectedMaximums);
  });

  it('should update the max when a new, larger value enters the window', () => {
    const valuesToAdd = [1, 2, 1, 4];
    const expectedMaximums = [1, 2, 2, 4];
    runTest(3, 5, valuesToAdd, expectedMaximums);
  });

  it('should update the max when the old max slides out of the window', () => {
    const valuesToAdd = [5, 4, 3, 2, 1];
    const expectedMaximums = [5, 5, 5, 4, 3];
    runTest(3, 5, valuesToAdd, expectedMaximums);
  });

  it('should function correctly when internal capacity is reached and reset', () => {
    const valuesToAdd = [10, 9, 8, 12, 7];
    const expectedMaximums = [10, 10, 9, 12, 12];
    runTest(2, 3, valuesToAdd, expectedMaximums);
  });

  it('should handle a new max arriving at the same time the old max leaves', () => {
    const valuesToAdd = [5, 1, 1, 6];
    const expectedMaximums = [5, 5, 5, 6];
    runTest(3, 5, valuesToAdd, expectedMaximums);
  });

  it('should handle scenarios with duplicate values', () => {
    const valuesToAdd = [5, 5, 2, 2, 3, 4];
    const expectedMaximums = [5, 5, 5, 5, 5, 4];
    runTest(4, 10, valuesToAdd, expectedMaximums);
  });

  it('should handle a long sequence of varying numbers', () => {
    const valuesToAdd = [1, 5, 3, 6, 2, 7, 4, 8, 5, 9, 1, 10, 2, 11, 3, 12, 4, 13, 5, 14];
    const expectedMaximums = [1, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14];
    runTest(5, 10, valuesToAdd, expectedMaximums);
  });

  it('should handle a long sequence with a decreasing trend', () => {
    const valuesToAdd = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const expectedMaximums = [
      20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5,
    ];
    runTest(5, 25, valuesToAdd, expectedMaximums);
  });

  it('should correctly evict old max values even when head index is small', () => {
    const valuesToAdd = [10, 1, 2, 3, 4];
    const expectedMaximums = [10, 10, 10, 3, 4];
    runTest(3, 10, valuesToAdd, expectedMaximums);
  });
});
