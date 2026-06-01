import { describe, it, expect } from 'vitest';
import { simpleRegression, multipleRegression, regressionMethods } from './regression';

describe('simpleRegression', () => {
  it('should compute slope and intercept for a perfect line', () => {
    const points = [{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }];
    const result = simpleRegression(points, 4);
    expect(result.coefficients[1]).toBeCloseTo(2, 5);
    expect(result.coefficients[0]).toBeCloseTo(1, 5);
    expect(result.predictedValue).toBeCloseTo(9, 5);
    expect(result.rSquared).toBeCloseTo(1, 5);
  });

  it('should compute R² < 1 for noisy data', () => {
    const points = [{ x: 1, y: 2 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 8 }];
    const result = simpleRegression(points, 5);
    expect(result.rSquared).toBeGreaterThan(0);
    expect(result.rSquared).toBeLessThan(1);
  });

  it('should return R² = 1 when all points are identical y', () => {
    const points = [{ x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }];
    const result = simpleRegression(points, 4);
    expect(result.rSquared).toBe(1);
    expect(result.predictedValue).toBeCloseTo(5, 5);
  });

  it('should produce an equation string', () => {
    const points = [{ x: 0, y: 2 }, { x: 1, y: 4 }];
    const result = simpleRegression(points, 5);
    expect(result.equation).toContain('y =');
    expect(result.equation).toContain('x');
  });

  it('should return steps array with key calculations', () => {
    const points = [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }];
    const result = simpleRegression(points, 5);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps[0]).toContain('n =');
    expect(result.steps[2]).toContain('Slope');
    expect(result.steps[3]).toContain('Intercept');
  });

  it('should throw for fewer than 2 points', () => {
    expect(() => simpleRegression([{ x: 1, y: 2 }], 3)).toThrow('At least 2 data points');
  });

  it('should throw when all X values are identical', () => {
    const points = [{ x: 5, y: 2 }, { x: 5, y: 4 }, { x: 5, y: 6 }];
    expect(() => simpleRegression(points, 10)).toThrow('all X values are identical');
  });

  it('should handle negative slope', () => {
    const points = [{ x: 1, y: 10 }, { x: 2, y: 7 }, { x: 3, y: 4 }];
    const result = simpleRegression(points, 4);
    expect(result.coefficients[1]).toBeLessThan(0);
    expect(result.predictedValue).toBeCloseTo(1, 5);
  });

  it('should handle two points exactly', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 20 }];
    const result = simpleRegression(points, 5);
    expect(result.coefficients[1]).toBeCloseTo(2, 5);
    expect(result.coefficients[0]).toBeCloseTo(0, 5);
    expect(result.predictedValue).toBeCloseTo(10, 5);
    expect(result.rSquared).toBeCloseTo(1, 5);
  });

  it('should include predictedValue in steps', () => {
    const points = [{ x: 1, y: 2 }, { x: 3, y: 6 }];
    const result = simpleRegression(points, 4);
    expect(result.steps[result.steps.length - 1]).toContain('Predicted y');
  });
});

describe('multipleRegression', () => {
  it('should compute coefficients for a known linear relationship', () => {
    const points = [
      { x1: 1, x2: 1, y: 4 },
      { x1: 2, x2: 1, y: 5 },
      { x1: 1, x2: 2, y: 6 },
      { x1: 2, x2: 2, y: 7 },
      { x1: 3, x2: 1, y: 6 },
    ];
    const result = multipleRegression(points, 3, 2);
    expect(result.rSquared).toBeCloseTo(1, 3);
    expect(result.predictedValue).toBeCloseTo(8, 1);
  });

  it('should return R² = 1 for a perfect planar relationship', () => {
    const points = [
      { x1: 0, x2: 0, y: 1 },
      { x1: 1, x2: 0, y: 3 },
      { x1: 0, x2: 1, y: 5 },
      { x1: 1, x2: 1, y: 7 },
    ];
    const result = multipleRegression(points, 2, 2);
    expect(result.rSquared).toBeCloseTo(1, 5);
    expect(result.coefficients[0]).toBeCloseTo(1, 3);
    expect(result.coefficients[1]).toBeCloseTo(2, 3);
    expect(result.coefficients[2]).toBeCloseTo(4, 3);
  });

  it('should produce an equation string with x₁ and x₂', () => {
    const points = [
      { x1: 1, x2: 1, y: 5 },
      { x1: 2, x2: 1, y: 7 },
      { x1: 1, x2: 2, y: 8 },
    ];
    const result = multipleRegression(points, 3, 3);
    expect(result.equation).toContain('x₁');
    expect(result.equation).toContain('x₂');
  });

  it('should return steps with coefficient details', () => {
    const points = [
      { x1: 1, x2: 2, y: 6 },
      { x1: 2, x2: 1, y: 5 },
      { x1: 3, x2: 3, y: 10 },
      { x1: 4, x2: 2, y: 9 },
    ];
    const result = multipleRegression(points, 5, 3);
    expect(result.steps[1]).toContain('β₀');
    expect(result.steps[2]).toContain('β₁');
    expect(result.steps[3]).toContain('β₂');
  });

  it('should throw for fewer than 3 points', () => {
    const points = [
      { x1: 1, x2: 1, y: 4 },
      { x1: 2, x2: 1, y: 5 },
    ];
    expect(() => multipleRegression(points, 3, 3)).toThrow('At least 3 data points');
  });

  it('should throw for collinear variables (singular matrix)', () => {
    const points = [
      { x1: 1, x2: 1, y: 2 },
      { x1: 2, x2: 2, y: 4 },
      { x1: 3, x2: 3, y: 6 },
    ];
    expect(() => multipleRegression(points, 4, 4)).toThrow('Singular matrix');
  });

  it('should handle R² = 1 for a perfect planar relationship with different x1/x2', () => {
    const points = [
      { x1: 0, x2: 0, y: 3 },
      { x1: 1, x2: 0, y: 5 },
      { x1: 0, x2: 1, y: 7 },
      { x1: 1, x2: 1, y: 9 },
    ];
    const result = multipleRegression(points, 2, 2);
    expect(result.rSquared).toBeCloseTo(1, 5);
    expect(result.predictedValue).toBeCloseTo(15, 1);
  });
});

describe('regressionMethods registry', () => {
  it('should contain simple and multiple methods', () => {
    expect(regressionMethods).toHaveProperty('simple');
    expect(regressionMethods).toHaveProperty('multiple');
  });
});
