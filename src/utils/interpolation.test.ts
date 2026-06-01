import { describe, it, expect } from 'vitest';
import { linearInterpolation, lagrangeInterpolation, cubicSplineInterpolation, interpolationMethods } from './interpolation';

describe('linearInterpolation', () => {
  it('should interpolate between two points', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 20 }];
    const result = linearInterpolation(points, 5);
    expect(result.value).toBeCloseTo(10, 5);
    expect(result.method).toBe('Linear Interpolation');
  });

  it('should extrapolate below the data range', () => {
    const points = [{ x: 2, y: 4 }, { x: 4, y: 8 }];
    const result = linearInterpolation(points, 0);
    expect(result.value).toBeCloseTo(0, 5);
  });

  it('should extrapolate above the data range', () => {
    const points = [{ x: 2, y: 4 }, { x: 4, y: 8 }];
    const result = linearInterpolation(points, 6);
    expect(result.value).toBeCloseTo(12, 5);
  });

  it('should find the correct interval for interpolation', () => {
    const points = [{ x: 0, y: 0 }, { x: 5, y: 10 }, { x: 10, y: 20 }];
    const result = linearInterpolation(points, 7.5);
    expect(result.value).toBeCloseTo(15, 5);
  });

  it('should return steps array', () => {
    const points = [{ x: 1, y: 2 }, { x: 3, y: 6 }];
    const result = linearInterpolation(points, 2);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps[0]).toContain('Using points');
  });

  it('should throw for fewer than 2 points', () => {
    expect(() => linearInterpolation([{ x: 1, y: 2 }], 3)).toThrow('At least 2 points');
  });

  it('should throw for duplicate X values', () => {
    const points = [{ x: 1, y: 2 }, { x: 1, y: 4 }];
    expect(() => linearInterpolation(points, 3)).toThrow('Duplicate X');
  });

  it('should sort unsorted points', () => {
    const points = [{ x: 10, y: 20 }, { x: 0, y: 0 }, { x: 5, y: 10 }];
    const result = linearInterpolation(points, 7.5);
    expect(result.value).toBeCloseTo(15, 5);
  });

  it('should handle negative values', () => {
    const points = [{ x: -5, y: -10 }, { x: 5, y: 10 }];
    const result = linearInterpolation(points, 0);
    expect(result.value).toBeCloseTo(0, 5);
  });
});

describe('lagrangeInterpolation', () => {
  it('should exactly pass through given points', () => {
    const points = [{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 7 }];
    const result = lagrangeInterpolation(points, 1);
    expect(result.value).toBeCloseTo(3, 10);
  });

  it('should interpolate for a line through 2 points', () => {
    const points = [{ x: 0, y: 0 }, { x: 2, y: 4 }];
    const result = lagrangeInterpolation(points, 1);
    expect(result.value).toBeCloseTo(2, 5);
  });

  it('should handle 3 points with quadratic polynomial', () => {
    const points = [{ x: -1, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 1 }];
    const result = lagrangeInterpolation(points, 0.5);
    expect(result.value).toBeCloseTo(0.25, 5);
  });

  it('should handle 5 points (maximum allowed)', () => {
    const points = [
      { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 8 },
      { x: 3, y: 27 }, { x: 4, y: 64 },
    ];
    const result = lagrangeInterpolation(points, 2);
    expect(result.value).toBeCloseTo(8, 5);
  });

  it('should throw for more than 5 points', () => {
    const points = [
      { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 4 },
      { x: 3, y: 9 }, { x: 4, y: 16 }, { x: 5, y: 25 },
    ];
    expect(() => lagrangeInterpolation(points, 2.5)).toThrow('Maximum 5 points');
  });

  it('should throw for fewer than 2 points', () => {
    expect(() => lagrangeInterpolation([{ x: 1, y: 2 }], 3)).toThrow('At least 2 points');
  });

  it('should throw for duplicate X values', () => {
    const points = [{ x: 1, y: 2 }, { x: 1, y: 4 }, { x: 3, y: 6 }];
    expect(() => lagrangeInterpolation(points, 2)).toThrow('Duplicate X');
  });

  it('should return steps with Lagrange polynomial details', () => {
    const points = [{ x: 0, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 5 }];
    const result = lagrangeInterpolation(points, 1.5);
    expect(result.steps[0]).toContain('Lagrange polynomial');
    expect(result.method).toBe('Lagrange Polynomial Interpolation');
  });
});

describe('cubicSplineInterpolation', () => {
  it('should fall back to linear for 2 points', () => {
    const points = [{ x: 0, y: 0 }, { x: 4, y: 8 }];
    const result = cubicSplineInterpolation(points, 2);
    expect(result.value).toBeCloseTo(4, 5);
    expect(result.method).toBe('Linear Interpolation');
  });

  it('should interpolate with 3 points', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }];
    const result = cubicSplineInterpolation(points, 0.5);
    expect(result.value).toBeGreaterThan(0);
    expect(result.value).toBeLessThan(1);
    expect(result.method).toBe('Natural Cubic Spline Interpolation');
  });

  it('should pass through data points exactly', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }, { x: 3, y: 1 }];
    for (const p of points) {
      const result = cubicSplineInterpolation(points, p.x);
      expect(result.value).toBeCloseTo(p.y, 5);
    }
  });

  it('should throw when target is below data range', () => {
    const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }];
    expect(() => cubicSplineInterpolation(points, 0)).toThrow('outside the interpolation range');
  });

  it('should throw when target is above data range', () => {
    const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }];
    expect(() => cubicSplineInterpolation(points, 10)).toThrow('outside the interpolation range');
  });

  it('should throw for fewer than 2 points', () => {
    expect(() => cubicSplineInterpolation([{ x: 1, y: 2 }], 1)).toThrow('At least 2 points');
  });

  it('should throw for duplicate X values', () => {
    const points = [{ x: 1, y: 2 }, { x: 1, y: 4 }, { x: 3, y: 6 }];
    expect(() => cubicSplineInterpolation(points, 2)).toThrow('Duplicate X');
  });

  it('should return steps with spline details', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }];
    const result = cubicSplineInterpolation(points, 1.5);
    expect(result.steps[0]).toContain('cubic spline');
    expect(result.steps[1]).toContain('interval');
  });

  it('should accept target at the lower boundary', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }];
    const result = cubicSplineInterpolation(points, 0);
    expect(result.value).toBeCloseTo(0, 5);
  });

  it('should accept target at the upper boundary', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }];
    const result = cubicSplineInterpolation(points, 2);
    expect(result.value).toBeCloseTo(0, 5);
  });
});

describe('interpolationMethods registry', () => {
  it('should contain linear, lagrange, and spline methods', () => {
    expect(interpolationMethods).toHaveProperty('linear');
    expect(interpolationMethods).toHaveProperty('lagrange');
    expect(interpolationMethods).toHaveProperty('spline');
  });

  it('should call the correct function for each method', () => {
    const points = [{ x: 0, y: 0 }, { x: 2, y: 4 }, { x: 4, y: 8 }];
    const linearResult = interpolationMethods.linear(points, 1);
    expect(linearResult.method).toBe('Linear Interpolation');

    const lagrangeResult = interpolationMethods.lagrange(points, 1);
    expect(lagrangeResult.method).toBe('Lagrange Polynomial Interpolation');

    const splineResult = interpolationMethods.spline(points, 1);
    expect(splineResult.method).toBe('Natural Cubic Spline Interpolation');
  });
});
