import { describe, it, expect } from 'vitest';
import { deterministicBinaryRnd } from './deterministic-binary-rnd';

describe('deterministicBinaryRnd', () => {
  it('should produce different sequences for different seed1 values', () => {
    const rnd1 = deterministicBinaryRnd(1);
    const rnd2 = deterministicBinaryRnd(2);

    const sequence1 = Array.from({ length: 10 }, (_, i) => rnd1(i));
    const sequence2 = Array.from({ length: 10 }, (_, i) => rnd2(i));

    expect(sequence1).not.toEqual(sequence2);
  });

  it('should produce the same result for the same seed combination', () => {
    const seed1 = 123;
    const seed2 = 456;
    const result1 = deterministicBinaryRnd(seed1)(seed2);
    const result2 = deterministicBinaryRnd(seed1)(seed2);
    expect(result1).toEqual(result2);
  });

  it('should produce different results for different seed2 values', () => {
    const rnd = deterministicBinaryRnd(1);
    const sequence = Array.from({ length: 10 }, (_, i) => rnd(i));
    const allTheSame = sequence.every((val) => val === sequence[0]);
    expect(allTheSame).toBe(false);
  });

  it.each([1, 2, 3, 42, 97, 4695947])(
    'should exhibit random-like behavior in terms of run lengths for seed %s',
    { timeout: 20000 },
    (seed) => {
      const N = 10_000;
      const rnd = deterministicBinaryRnd(seed);

      const runs = new Map<number, number>();
      let lastVal = rnd(0);
      let runLength = 1;

      for (let i = 1; i < N; i++) {
        const currentVal = rnd(i);
        if (currentVal === lastVal) {
          runLength++;
        } else {
          runs.set(runLength, (runs.get(runLength) || 0) + 1);
          lastVal = currentVal;
          runLength = 1;
        }
      }
      runs.set(runLength, (runs.get(runLength) || 0) + 1);

      // For a random binary sequence, the probability of a run of length k is 1/2^k.
      // We check if the observed number of runs for lengths 1 to 5
      // is within a tolerance of the expected number.

      const tolerance = 0.2; // 20%

      for (let k = 1; k <= 5; k++) {
        const expectedCount = N / (2 << k);
        const actualCount = runs.get(k) || 0;
        const lowerBound = expectedCount * (1 - tolerance);
        const upperBound = expectedCount * (1 + tolerance);

        expect(actualCount).toBeGreaterThanOrEqual(lowerBound);
        expect(actualCount).toBeLessThanOrEqual(upperBound);
      }
    }
  );
});
