import { describe, it, expect } from 'vitest';
import { Matrix } from './matrix';

describe('Matrix', () => {
  describe('Constructor', () => {
    it('should create a matrix with default Int8Array', () => {
      // prettier-ignore
      const data = [
        1, 2,
        3, 4,
      ];
      const matrix = new Matrix(data, 2, 2);

      expect(matrix.width).toBe(2);
      expect(matrix.height).toBe(2);
      expect(matrix.matrix).toBeInstanceOf(Int8Array);
      // prettier-ignore
      expect(Array.from(matrix.matrix)).toEqual([
        1, 2,
        3, 4,
      ]);
    });

    it('should create a matrix with Float32Array', () => {
      // prettier-ignore
      const data = [
        1.5, 2.5,
        3.5, 4.5,
      ];
      const matrix = new Matrix(data, 2, 2, Float32Array);

      expect(matrix.width).toBe(2);
      expect(matrix.height).toBe(2);
      expect(matrix.matrix).toBeInstanceOf(Float32Array);
    });

    it('should create a matrix with different array types', () => {
      // prettier-ignore
      const data = [
        1, 2, 3,
        4, 5, 6,
      ];
      const matrix = new Matrix(data, 3, 2, Uint16Array);

      expect(matrix.width).toBe(3);
      expect(matrix.height).toBe(2);
      expect(matrix.matrix).toBeInstanceOf(Uint16Array);
    });
  });

  describe('get and set methods', () => {
    it('should get and set values correctly', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2,
        3, 4,
      ], 2, 2);

      expect(matrix.get(0, 0)).toBe(1);
      expect(matrix.get(1, 0)).toBe(2);
      expect(matrix.get(0, 1)).toBe(3);
      expect(matrix.get(1, 1)).toBe(4);

      matrix.set(0, 0, 10);
      matrix.set(1, 1, 20);

      expect(matrix.get(0, 0)).toBe(10);
      expect(matrix.get(1, 1)).toBe(20);
    });

    it('should handle larger matrices', () => {
      // prettier-ignore
      const data = [
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      ];
      const matrix = new Matrix(data, 3, 3);

      // prettier-ignore
      expect(Array.from(matrix.matrix)).toEqual([
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      ]);

      matrix.set(1, 1, 99); // Center position
      expect(matrix.get(1, 1)).toBe(99);
    });
  });

  describe('rotate method (creates new matrix)', () => {
    it('should rotate 2x2 matrix 90 degrees clockwise', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2,
        3, 4,
      ], 2, 2);
      const rotated = matrix.rotate(90);

      expect(rotated.width).toBe(2);
      expect(rotated.height).toBe(2);
      // prettier-ignore
      expect(Array.from(rotated.matrix)).toEqual([
        3, 1,
        4, 2,
      ]);

      // Original should be unchanged
      // prettier-ignore
      expect(Array.from(matrix.matrix)).toEqual([
        1, 2,
        3, 4,
      ]);
    });

    it('should rotate 2x2 matrix 180 degrees', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2,
        3, 4,
      ], 2, 2);
      const rotated = matrix.rotate(180);

      expect(rotated.width).toBe(2);
      expect(rotated.height).toBe(2);
      // prettier-ignore
      expect(Array.from(rotated.matrix)).toEqual([
        4, 3,
        2, 1,
      ]);
    });

    it('should rotate 2x2 matrix 270 degrees clockwise', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2,
        3, 4,
      ], 2, 2);
      const rotated = matrix.rotate(270);

      expect(rotated.width).toBe(2);
      expect(rotated.height).toBe(2);
      // prettier-ignore
      expect(Array.from(rotated.matrix)).toEqual([
        2, 4,
        1, 3,
      ]);
    });

    it('should rotate 3x3 matrix 90 degrees clockwise', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      ], 3, 3);
      const rotated = matrix.rotate(90);

      expect(rotated.width).toBe(3);
      expect(rotated.height).toBe(3);
      // prettier-ignore
      expect(Array.from(rotated.matrix)).toEqual([
        7, 4, 1,
        8, 5, 2,
        9, 6, 3,
      ]);
    });

    it('should rotate rectangular matrix 90 degrees', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2, 3,
        4, 5, 6,
      ], 3, 2);
      const rotated = matrix.rotate(90);

      expect(rotated.width).toBe(2);
      expect(rotated.height).toBe(3);
      // prettier-ignore
      expect(Array.from(rotated.matrix)).toEqual([
        4, 1,
        5, 2,
        6, 3,
      ]);
    });

    it('should handle negative degree values', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2,
        3, 4,
      ], 2, 2);
      const rotated = matrix.rotate(-90);

      // prettier-ignore
      expect(Array.from(rotated.matrix)).toEqual([
        2, 4,
        1, 3,
      ]);
    });

    it('should handle degree values greater than 360', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2,
        3, 4,
      ], 2, 2);
      const rotated = matrix.rotate(360 + 90);

      // Should be equivalent to 90 degrees
      // prettier-ignore
      expect(Array.from(rotated.matrix)).toEqual([
        3, 1,
        4, 2,
      ]);
    });
  });

  describe('rotateInPlace method', () => {
    it('should rotate square matrix in place 90 degrees', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2,
        3, 4,
      ], 2, 2);
      const result = matrix.rotateInPlace(90);

      expect(result).toBe(matrix); // Should return the same instance
      // prettier-ignore
      expect(Array.from(matrix.matrix)).toEqual([
        3, 1,
        4, 2,
      ]);
    });

    it('should rotate square matrix in place 180 degrees', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2,
        3, 4,
      ], 2, 2);
      matrix.rotateInPlace(180);

      // prettier-ignore
      expect(Array.from(matrix.matrix)).toEqual([
        4, 3,
        2, 1,
      ]);
    });

    it('should rotate square matrix in place 270 degrees', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2,
        3, 4,
      ], 2, 2);
      matrix.rotateInPlace(270);

      // prettier-ignore
      expect(Array.from(matrix.matrix)).toEqual([
        2, 4,
        1, 3,
      ]);
    });

    it('should rotate 3x3 matrix in place 90 degrees', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      ], 3, 3);
      matrix.rotateInPlace(90);

      // prettier-ignore
      expect(Array.from(matrix.matrix)).toEqual([
        7, 4, 1,
        8, 5, 2,
        9, 6, 3,
      ]);
    });

    it('should rotate rectangular matrix in place 180 degrees', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2, 3,
        4, 5, 6,
      ], 3, 2);
      matrix.rotateInPlace(180);

      // prettier-ignore
      expect(Array.from(matrix.matrix)).toEqual([
        6, 5, 4,
        3, 2, 1,
      ]);
    });
  });

  describe('Error handling', () => {
    it('should throw error for 0 degree rotation', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2,
        3, 4,
      ], 2, 2);

      expect(() => matrix.rotate(0)).toThrow();
      expect(() => matrix.rotateInPlace(0)).toThrow();
    });

    it('should throw error for non-90-degree increments', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2,
        3, 4,
      ], 2, 2);

      expect(() => matrix.rotate(45)).toThrow();
      expect(() => matrix.rotate(30)).toThrow();
      expect(() => matrix.rotateInPlace(45)).toThrow();
      expect(() => matrix.rotateInPlace(30)).toThrow();
    });

    it('should throw error for non-square matrix in-place 90/270 degree rotation', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2, 3,
        4, 5, 6,
      ], 3, 2);

      expect(() => matrix.rotateInPlace(90)).toThrow();
      expect(() => matrix.rotateInPlace(270)).toThrow();
    });
  });

  describe('Different array types', () => {
    it('should preserve array type after rotation', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1.5, 2.5,
        3.5, 4.5,
      ], 2, 2, Float32Array);
      const rotated = matrix.rotate(90);

      expect(rotated.matrix).toBeInstanceOf(Float32Array);
    });

    it('should work with Uint8Array', () => {
      // prettier-ignore
      const matrix = new Matrix([
        255, 128,
        64,  32,
      ], 2, 2, Uint8Array);
      const rotated = matrix.rotate(90);

      expect(rotated.matrix).toBeInstanceOf(Uint8Array);
      // prettier-ignore
      expect(Array.from(rotated.matrix)).toEqual([
        64, 255,
        32, 128,
      ]);
    });
  });

  describe('Matrix properties', () => {
    it('should return correct width and height', () => {
      // prettier-ignore
      const matrix = new Matrix([
        1, 2, 3,
        4, 5, 6,
      ], 3, 2);

      expect(matrix.width).toBe(3);
      expect(matrix.height).toBe(2);
    });

    it('should return the underlying matrix array', () => {
      // prettier-ignore
      const data = [
        1, 2,
        3, 4,
      ];
      const matrix = new Matrix(data, 2, 2);

      expect(matrix.matrix).toBeInstanceOf(Int8Array);
      // prettier-ignore
      expect(Array.from(matrix.matrix)).toEqual([
        1, 2,
        3, 4,
      ]);
    });
  });
});
