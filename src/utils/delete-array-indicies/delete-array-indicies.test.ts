import { deleteArrayIndices } from './delete-array-indicies';
import { describe, it, expect } from 'vitest';

describe('deleteArrayIndices', () => {
  it('should remove single element', () => {
    const array = new Int8Array([1, 2, 3, 4, 5]);
    const result = deleteArrayIndices(array, [2]);
    expect(Array.from(result)).toEqual([1, 2, 4, 5]);
    expect(result).toBeInstanceOf(Int8Array);
  });

  it('should remove multiple elements', () => {
    const array = new Int8Array([1, 2, 3, 4, 5, 6, 7]);
    const result = deleteArrayIndices(array, [1, 3, 5]);
    expect(Array.from(result)).toEqual([1, 3, 5, 7]);
    expect(result).toBeInstanceOf(Int8Array);
  });

  // it('should handle unsorted indices', () => {
  //   const array = new Int8Array([1, 2, 3, 4, 5]);
  //   const result = deleteArrayIndices(array, [3, 1, 4]);
  //   expect(Array.from(result)).toEqual([1, 3]);
  //   expect(result).toBeInstanceOf(Int8Array);
  // });

  // it('should handle duplicate indices gracefully', () => {
  //   const array = new Int8Array([1, 2, 3, 4, 5]);
  //   const result = deleteArrayIndices(array, [1, 1, 3]);
  //   expect(Array.from(result)).toEqual([1, 3, 5]);
  //   expect(result).toBeInstanceOf(Int8Array);
  // });

  it('should handle empty indices array', () => {
    const array = new Int8Array([1, 2, 3, 4, 5]);
    const result = deleteArrayIndices(array, []);
    expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
    expect(result).toBeInstanceOf(Int8Array);
  });

  // it('should handle empty array', () => {
  //   const array = new Int8Array([]);
  //   const result = deleteArrayIndices(array, [0, 1]);
  //   expect(Array.from(result)).toEqual([]);
  //   expect(result).toBeInstanceOf(Int8Array);
  // });

  // it('should handle out of bounds indices', () => {
  //   const array = new Int8Array([1, 2, 3]);
  //   const result = deleteArrayIndices(array, [-1, 1, 5, 10]);
  //   expect(Array.from(result)).toEqual([1, 3]);
  //   expect(result).toBeInstanceOf(Int8Array);
  // });

  it('should handle removing all elements', () => {
    const array = new Int8Array([1, 2, 3]);
    const result = deleteArrayIndices(array, [0, 1, 2]);
    expect(Array.from(result)).toEqual([]);
    expect(result.length).toBe(0);
    expect(result).toBeInstanceOf(Int8Array);
  });

  it('should handle removing first element', () => {
    const array = new Int8Array([10, 20, 30, 40]);
    const result = deleteArrayIndices(array, [0]);
    expect(Array.from(result)).toEqual([20, 30, 40]);
    expect(result).toBeInstanceOf(Int8Array);
  });

  it('should handle removing last element', () => {
    const array = new Int8Array([10, 20, 30, 40]);
    const result = deleteArrayIndices(array, [3]);
    expect(Array.from(result)).toEqual([10, 20, 30]);
    expect(result).toBeInstanceOf(Int8Array);
  });

  it('should handle removing consecutive elements', () => {
    const array = new Int8Array([1, 2, 3, 4, 5, 6]);
    const result = deleteArrayIndices(array, [2, 3, 4]);
    expect(Array.from(result)).toEqual([1, 2, 6]);
    expect(result).toBeInstanceOf(Int8Array);
  });

  it('should handle large gaps between removals', () => {
    const array = new Int8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = deleteArrayIndices(array, [1, 8]);
    expect(Array.from(result)).toEqual([1, 3, 4, 5, 6, 7, 8, 10]);
    expect(result).toBeInstanceOf(Int8Array);
  });

  it('should handle large arrays efficiently', () => {
    // Test with a reasonably large array to ensure performance
    const array = new Int8Array(Array.from({ length: 10000 }, (_, i) => i % 128));
    const indicesToRemove = Array.from({ length: 1000 }, (_, i) => i * 10);

    const start = performance.now();
    const result = deleteArrayIndices(array, indicesToRemove);
    const end = performance.now();

    expect(result.length).toBe(9000);
    expect(result[0]).toBe(1); // First element after removing 0
    expect(result[1]).toBe(2); // Second element
    expect(end - start).toBeLessThan(100); // Should be very fast
    expect(result).toBeInstanceOf(Int8Array);
  });

  it('should honor elementsPerRemoval parameter', () => {
    const array = new Int8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = deleteArrayIndices(array, [1, 5], 2);
    // Remove 2 elements starting at index 1 (removes 2,3) and 2 elements starting at index 5 (removes 6,7)
    expect(Array.from(result)).toEqual([1, 4, 5, 8, 9, 10]);
    expect(result).toBeInstanceOf(Int8Array);
  });

  it('should honor elementsPerRemoval with larger chunks', () => {
    const array = new Int8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const result = deleteArrayIndices(array, [2, 8], 3);
    // Remove 3 elements starting at index 2 (removes 3,4,5) and 3 elements starting at index 8 (removes 9,10,11)
    expect(Array.from(result)).toEqual([1, 2, 6, 7, 8, 12]);
    expect(result).toBeInstanceOf(Int8Array);
  });

  describe('type preservation tests', () => {
    it('should preserve Int8Array type', () => {
      const array = new Int8Array([1, 2, 3, 4, 5]);
      const result = deleteArrayIndices(array, [1, 3]);
      expect(result).toBeInstanceOf(Int8Array);
      expect(result.constructor).toBe(Int8Array);
      expect(Array.from(result)).toEqual([1, 3, 5]);
    });

    it('should preserve Uint8Array type', () => {
      const array = new Uint8Array([1, 2, 3, 4, 5]);
      const result = deleteArrayIndices(array, [0, 2]);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.constructor).toBe(Uint8Array);
      expect(Array.from(result)).toEqual([2, 4, 5]);
    });

    it('should preserve Int16Array type', () => {
      const array = new Int16Array([100, 200, 300, 400, 500]);
      const result = deleteArrayIndices(array, [1, 3]);
      expect(result).toBeInstanceOf(Int16Array);
      expect(result.constructor).toBe(Int16Array);
      expect(Array.from(result)).toEqual([100, 300, 500]);
    });

    it('should preserve Float32Array type', () => {
      // Warning: Float32Array apparently causes *immediate* floating point precision issues
      //   Updating these values to anything other than #.0 or #.5 will likely break this test
      const array = new Float32Array([1.5, 2.5, 3.5, 4.5, 5.5]);
      const result = deleteArrayIndices(array, [0, 4]);
      expect(result).toBeInstanceOf(Float32Array);
      expect(result.constructor).toBe(Float32Array);
      expect(Array.from(result)).toEqual([2.5, 3.5, 4.5]);
    });

    it('should preserve BigInt64Array type', () => {
      const array = new BigInt64Array([1n, 2n, 3n, 4n, 5n]);
      const result = deleteArrayIndices(array, [1, 3]);
      expect(result).toBeInstanceOf(BigInt64Array);
      expect(result.constructor).toBe(BigInt64Array);
      expect(Array.from(result)).toEqual([1n, 3n, 5n]);
    });
  });
});
