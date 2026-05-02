import { describe, it, expect } from 'vitest';
import { linear, exponential, logarithmic, polynomial, quadratic } from './extrapolation';

describe('linear extrapolation', () => {
  it('should extrapolate a simple linear relationship', () => {
    const points = [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }];
    const result = linear(points, 5);
    expect(result.value).toBeCloseTo(10, 1);
    expect(result.rSquared).toBeCloseTo(1, 5);
    expect(result.method).toBe('linear');
  });

  it('should handle two points', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const result = linear(points, 10);
    expect(result.value).toBeCloseTo(10, 1);
    expect(result.rSquared).toBeCloseTo(1, 5);
  });

  it('should return R² < 1 for noisy data', () => {
    const points = [{ x: 1, y: 2 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 8 }];
    const result = linear(points, 5);
    expect(result.rSquared).toBeLessThan(1);
    expect(result.rSquared).toBeGreaterThan(0);
  });

  it('should produce an equation string', () => {
    const points = [{ x: 1, y: 2 }, { x: 2, y: 4 }];
    const result = linear(points, 5);
    expect(result.equation).toContain('y =');
    expect(result.equation).toContain('x');
  });

  it('should handle horizontal line', () => {
    const points = [{ x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }];
    const result = linear(points, 10);
    expect(result.value).toBeCloseTo(5, 1);
  });
});

describe('exponential extrapolation', () => {
  it('should extrapolate exponential growth', () => {
    const points = [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 8 }];
    const result = exponential(points, 4);
    expect(result.value).toBeCloseTo(16, 0);
    expect(result.method).toBe('exponential');
  });

  it('should handle positive-only y values', () => {
    const points = [{ x: 1, y: 10 }, { x: 2, y: 20 }, { x: 3, y: 40 }];
    const result = exponential(points, 5);
    expect(result.value).toBeGreaterThan(0);
  });

  it('should fall back to linear for negative y values', () => {
    const points = [{ x: 1, y: -2 }, { x: 2, y: -4 }];
    const result = exponential(points, 3);
    expect(result.value).toBeDefined();
    expect(isFinite(result.value)).toBe(true);
  });
});

describe('logarithmic extrapolation', () => {
  it('should extrapolate logarithmic data', () => {
    const points = [{ x: 1, y: 0 }, { x: Math.E, y: 1 }, { x: Math.E * Math.E, y: 2 }];
    const result = logarithmic(points, Math.E * Math.E * Math.E);
    expect(result.value).toBeCloseTo(3, 1);
    expect(result.method).toBe('logarithmic');
  });

  it('should fall back to linear for non-positive x', () => {
    const points = [{ x: -1, y: 2 }, { x: -2, y: 4 }];
    const result = logarithmic(points, 3);
    expect(result.value).toBeDefined();
  });
});

describe('polynomial extrapolation', () => {
  it('should fit a quadratic curve with degree 2', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 4 }, { x: 3, y: 9 }];
    const result = polynomial(points, 4, 2);
    expect(result.value).toBeCloseTo(16, 0);
    expect(result.method).toBe('polynomial');
  });

  it('should default to degree 3', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 8 }, { x: 3, y: 27 }];
    const result = polynomial(points, 4);
    expect(result.value).toBeDefined();
    expect(isFinite(result.value)).toBe(true);
  });

  it('should reduce degree when insufficient points', () => {
    const points = [{ x: 1, y: 2 }, { x: 2, y: 4 }];
    const result = polynomial(points, 5, 5);
    expect(result.value).toBeDefined();
    expect(isFinite(result.value)).toBe(true);
    expect(result.method).toBe('polynomial');
  });
});

describe('quadratic extrapolation', () => {
  it('should be equivalent to polynomial with degree 2', () => {
    const points = [{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 7 }];
    const qResult = quadratic(points, 4);
    const pResult = polynomial(points, 4, 2);
    expect(qResult.value).toBeCloseTo(pResult.value, 5);
    expect(qResult.method).toBe('polynomial');
  });
});

describe('CalculationResult structure', () => {
  it('should always include required fields', () => {
    const points = [{ x: 1, y: 2 }, { x: 2, y: 4 }];
    const result = linear(points, 5);
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('rSquared');
    expect(result).toHaveProperty('equation');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('method');
    expect(typeof result.value).toBe('number');
    expect(typeof result.rSquared).toBe('number');
    expect(typeof result.equation).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.method).toBe('string');
  });

  it('should have rSquared between 0 and 1', () => {
    const points = [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 7 }, { x: 4, y: 9 }];
    const result = linear(points, 5);
    expect(result.rSquared).toBeGreaterThanOrEqual(0);
    expect(result.rSquared).toBeLessThanOrEqual(1);
  });
});
