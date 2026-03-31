// Unit tests for vector.ts
import { describe, it, expect } from 'vitest';
import { cosineSimilarity } from '../src/search/vector';

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const a = [1, 2, 3];
    const b = [1, 2, 3];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(1);
  });

  it('should return -1 for different length vectors', () => {
    const a = [1, 2, 3];
    const b = [1, 2];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(-1);
  });

  it('should return -1 for undefined elements in vector', () => {
    const a = [1, undefined, 3];
    const b = [4, 5, 6];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(-1);
  });

  it('should handle null elements in vector as undefined length', () => {
    const a = [1, null, 3];
    const b = [4, 5, 6];

    const result = cosineSimilarity(a, b);

    // null values are treated as undefined length
    expect(result).toBe(-1);
  });

  it('should handle orthogonal vectors', () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(0);
  });

  it('should handle positive dot product vectors (parallel)', () => {
    const a = [1, 1, 1];
    const b = [2, 2, 2];

    const result = cosineSimilarity(a, b);

    // [1,1,1] and [2,2,2] are parallel, so similarity should be 1
    expect(result).toBeCloseTo(1, 1);
  });

  it('should handle negative dot product vectors (anti-parallel)', () => {
    const a = [1, 1, 1];
    const b = [-2, -2, -2];

    const result = cosineSimilarity(a, b);

    // Parallel but opposite direction
    expect(result).toBeCloseTo(-1, 1);
  });

  it('should handle unit vectors', () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(0);
  });

  it('should handle 1D vectors', () => {
    const a = [5];
    const b = [10];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(1);
  });

  it('should handle larger vectors', () => {
    const a = Array.from({ length: 100 }, (_, i) => i + 1);
    const b = Array.from({ length: 100 }, (_, i) => i + 1);

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle vectors with mixed signs', () => {
    const a = [1, -2, 3, -4, 5];
    const b = [1, -2, 3, -4, 5];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(1);
  });

  it('should handle vectors with zeros', () => {
    const a = [1, 0, 0, 0];
    const b = [0, 1, 0, 0];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(0);
  });

  it('should handle vectors with negative values', () => {
    const a = [-1, -2, -3];
    const b = [-4, -8, -12]; // parallel to a

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 1);
  });

  it('should handle very small vectors', () => {
    const a = [0.001, 0.002, 0.003];
    const b = [0.001, 0.002, 0.003];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle vectors with larger values', () => {
    const a = [1000, 2000, 3000];
    const b = [1000, 2000, 3000];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 1);
  });

  it('should handle vectors with fractional values', () => {
    const a = [1.5, 2.5, 3.5];
    const b = [1.5, 2.5, 3.5];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle sparse vectors', () => {
    const a = [1, 0, 0, 0, 0];
    const b = [0, 1, 0, 0, 0];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(0);
  });

  it('should handle vectors where one is all zeros', () => {
    const a = [0, 0, 0];
    const b = [1, 2, 3];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(-1);
  });

  it('should handle nearly parallel vectors', () => {
    const a = [1, 1, 1];
    const b = [1.001, 1.002, 1.003];

    const result = cosineSimilarity(a, b);

    expect(result).toBeGreaterThan(0.9);
  });

  it('should handle nearly orthogonal vectors', () => {
    const a = [1, 0, 0, 0, 0];
    const b = [0.001, 1.001, 0.002, 0.003, 0.004];

    const result = cosineSimilarity(a, b);

    // Close to 0 (orthogonal)
    expect(result).toBeCloseTo(0, 2);
  });

  it('should handle empty arrays', () => {
    const a: number[] = [];
    const b: number[] = [];

    const result = cosineSimilarity(a, b);

    // Empty vectors are considered undefined length
    expect(result).toBe(-1);
  });

  it('should handle single element arrays', () => {
    const a = [5];
    const b = [10];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(1);
  });

  it('should handle vectors with decimal precision issues gracefully', () => {
    const a = [Math.sqrt(2), Math.sqrt(2), 0];
    const b = [Math.sqrt(2), Math.sqrt(2), 0];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle vectors with NaN gracefully', () => {
    const a = [1, 2, NaN];
    const b = [4, 5, 6];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(-1);
  });

  it('should handle Infinity values gracefully', () => {
    const a = [1, Infinity, 3];
    const b = [4, 5, 6];

    const result = cosineSimilarity(a, b);

    // With Infinity, the normA will be Infinity, and the result should be a valid number
    expect(result).toBeLessThan(Infinity);
  });

  it('should handle vectors with varying magnitudes', () => {
    const a = [1, 1, 1];
    const b = [100, 100, 100];

    const result = cosineSimilarity(a, b);

    // Should still be 1 since they are parallel
    expect(result).toBeCloseTo(1, 1);
  });

  it('should compute correctly for random vectors', () => {
    const a = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
    const b = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];

    const result = cosineSimilarity(a, b);

    expect(result).toBeGreaterThanOrEqual(-1.01);
    expect(result).toBeLessThanOrEqual(1.01);
  });

  it('should handle 2D vectors with 90 degree angle', () => {
    const a = [1, 0];
    const b = [0, 1];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(0);
  });

  it('should handle 2D vectors with 45 degree angle', () => {
    const a = [1, 1];
    const b = [1, 0];

    const result = cosineSimilarity(a, b);

    // cos(45°) = 1/sqrt(2) ≈ 0.707
    expect(result).toBeCloseTo(1 / Math.sqrt(2), 2);
  });

  it('should handle 2D vectors with 0 degree angle', () => {
    const a = [1, 1];
    const b = [2, 2];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 1);
  });

  it('should handle 2D vectors with 180 degree angle', () => {
    const a = [1, 1];
    const b = [-1, -1];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(-1, 1);
  });

  it('should handle 3D vectors with 120 degree angle', () => {
    // Three vectors at 120 degrees from each other
    const a = [1, 0, 0];
    const b = [-0.5, Math.sqrt(3) / 2, 0];

    const result = cosineSimilarity(a, b);

    // cos(120°) = -0.5
    expect(result).toBeCloseTo(-0.5, 2);
  });

  it('should handle vectors in higher dimensions', () => {
    const dimension = 10;
    const a = Array.from({ length: dimension }, () => Math.random() - 0.5);
    const b = Array.from({ length: dimension }, () => Math.random() - 0.5);

    const result = cosineSimilarity(a, b);

    expect(result).toBeGreaterThanOrEqual(-1.01);
    expect(result).toBeLessThanOrEqual(1.01);
  });

  it('should handle very long vectors', () => {
    const dimension = 1000;
    const a = Array.from({ length: dimension }, () => Math.random() - 0.5);
    const b = Array.from({ length: dimension }, () => Math.random() - 0.5);

    const result = cosineSimilarity(a, b);

    expect(result).toBeGreaterThanOrEqual(-1.01);
    expect(result).toBeLessThanOrEqual(1.01);
  });

  it('should handle vectors with scientific notation values', () => {
    const a = [1e-10, 2e-10, 3e-10];
    const b = [1e-10, 2e-10, 3e-10];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle vectors with exponential notation values', () => {
    const a = [1e10, 2e10, 3e10];
    const b = [1e10, 2e10, 3e10];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 1);
  });

  it('should handle vectors with mixed precision', () => {
    const a = [1, 0.1, 0.01, 0.001];
    const b = [1, 0.1, 0.01, 0.001];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle vectors with alternating signs', () => {
    const a = [1, -1, 1, -1, 1];
    const b = [2, -2, 2, -2, 2];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 1);
  });

  it('should handle orthogonal vectors in 4D', () => {
    const a = [1, 0, 0, 0];
    const b = [0, 1, 0, 0];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(0);
  });

  it('should handle orthogonal vectors in 5D', () => {
    const a = [1, 0, 0, 0, 0];
    const b = [0, 1, 0, 0, 0];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(0);
  });

  it('should handle vectors with complex number patterns', () => {
    const a = [1, 2, 3, 4, 5];
    const b = [5, 4, 3, 2, 1]; // reverse of a

    const result = cosineSimilarity(a, b);

    // Should be different (less than 1)
    expect(result).toBeLessThan(1);
    expect(result).toBeGreaterThan(-1);
  });

  it('should handle vectors where result is exactly -1', () => {
    const a = [1, 0, 0];
    const b = [-1, 0, 0];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(-1);
  });

  it('should handle vectors where result is exactly 1', () => {
    const a = [1, 0, 0];
    const b = [2, 0, 0];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(1);
  });

  it('should handle vectors with extremely small magnitude', () => {
    const a = [1e-100, 2e-100, 3e-100];
    const b = [1e-100, 2e-100, 3e-100];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle vectors with extremely large magnitude', () => {
    const a = [1e100, 2e100, 3e100];
    const b = [1e100, 2e100, 3e100];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 1);
  });

  it('should handle vectors with mixed magnitude ranges', () => {
    const a = [1e-10, 1, 1e10];
    const b = [1e-10, 1, 1e10];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle vectors with sub-nanometer precision', () => {
    const a = [1e-9, 2e-9, 3e-9];
    const b = [1e-9, 2e-9, 3e-9];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle vectors with micro precision', () => {
    const a = [1e-6, 2e-6, 3e-6];
    const b = [1e-6, 2e-6, 3e-6];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle vectors with millimeter precision', () => {
    const a = [1e-3, 2e-3, 3e-3];
    const b = [1e-3, 2e-3, 3e-3];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle vectors with centimeter precision', () => {
    const a = [1e-2, 2e-2, 3e-2];
    const b = [1e-2, 2e-2, 3e-2];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle vectors with meter precision', () => {
    const a = [1, 2, 3];
    const b = [1, 2, 3];

    const result = cosineSimilarity(a, b);

    expect(result).toBe(1);
  });

  it('should handle vectors with kilometer precision', () => {
    const a = [1e3, 2e3, 3e3];
    const b = [1e3, 2e3, 3e3];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 1);
  });

  it('should handle vectors with megameter precision', () => {
    const a = [1e6, 2e6, 3e6];
    const b = [1e6, 2e6, 3e6];

    const result = cosineSimilarity(a, b);

    expect(result).toBeCloseTo(1, 1);
  });
});
