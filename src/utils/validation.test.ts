import { describe, it, expect } from 'vitest';
import { validatePoint, sanitizeInput, exportToCSV } from './validation';

describe('validatePoint', () => {
  it('should accept valid numbers', () => {
    expect(validatePoint('1', '2').valid).toBe(true);
    expect(validatePoint('-3.5', '0').valid).toBe(true);
    expect(validatePoint('0', '0').valid).toBe(true);
  });

  it('should reject empty strings', () => {
    expect(validatePoint('', '2').valid).toBe(false);
    expect(validatePoint('1', '').valid).toBe(false);
    expect(validatePoint('', '').valid).toBe(false);
  });

  it('should reject non-numeric strings', () => {
    expect(validatePoint('abc', '2').valid).toBe(false);
    expect(validatePoint('1', 'xyz').valid).toBe(false);
  });

  it('should reject NaN and Infinity', () => {
    expect(validatePoint('NaN', '2').valid).toBe(false);
    expect(validatePoint('1', 'Infinity').valid).toBe(false);
    expect(validatePoint('-Infinity', '2').valid).toBe(false);
  });

  it('should return an error message for invalid input', () => {
    const result = validatePoint('', '2');
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
  });
});

describe('sanitizeInput', () => {
  it('should strip dangerous characters', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
    expect(sanitizeInput('test&value')).toBe('testvalue');
    expect(sanitizeInput('"onclick"')).toBe('onclick');
    expect(sanitizeInput("'injection'")).toBe('injection');
  });

  it('should pass through safe strings', () => {
    expect(sanitizeInput('hello')).toBe('hello');
    expect(sanitizeInput('123')).toBe('123');
    expect(sanitizeInput('3.14')).toBe('3.14');
  });
});

describe('exportToCSV', () => {
  it('should generate CSV with header and rows', () => {
    const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
    const csv = exportToCSV(points);
    expect(csv).toContain('x,y');
    expect(csv).toContain('1,2');
    expect(csv).toContain('3,4');
  });

  it('should include result metadata when provided', () => {
    const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
    const result = { method: 'linear', equation: 'y = x + 1', value: 5, rSquared: 0.99, confidence: 99 };
    const csv = exportToCSV(points, result);
    expect(csv).toContain('Method,linear');
    expect(csv).toContain('Equation,y = x + 1');
    expect(csv).toContain('Extrapolated Value,5');
  });

  it('should work without result metadata', () => {
    const points = [{ x: 0, y: 0 }];
    const csv = exportToCSV(points);
    expect(csv).toContain('x,y');
    expect(csv).toContain('0,0');
    expect(csv).not.toContain('Method');
  });
});
