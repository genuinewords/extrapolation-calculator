export interface Point {
  x: number;
  y: number;
}

export interface CalculationResult {
  value: number;
  rSquared: number;
  equation: string;
  confidence: number;
  method: string;
}

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function computeRSquared(actual: number[], predicted: number[]): number {
  const yMean = mean(actual);
  const ssTot = actual.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const ssRes = actual.reduce((sum, y, i) => sum + (y - predicted[i]) ** 2, 0);
  if (ssTot === 0) return 1;
  return Math.max(0, 1 - ssRes / ssTot);
}

export function linear(points: Point[], targetX: number): CalculationResult {
  const n = points.length;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMean = mean(xs);
  const yMean = mean(ys);

  let ssXY = 0;
  let ssXX = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (xs[i] - xMean) * (ys[i] - yMean);
    ssXX += (xs[i] - xMean) ** 2;
  }

  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = yMean - slope * xMean;
  const predicted = xs.map((x) => slope * x + intercept);
  const rSquared = computeRSquared(ys, predicted);
  const value = slope * targetX + intercept;

  return {
    value,
    rSquared,
    equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
    confidence: rSquared * 100,
    method: 'linear',
  };
}

export function exponential(points: Point[], targetX: number): CalculationResult {
  const positivePoints = points.filter((p) => p.y > 0);
  if (positivePoints.length < 2) {
    return linear(points, targetX);
  }

  const logY = positivePoints.map((p) => ({ x: p.x, y: Math.log(p.y) }));
  const linResult = linear(logY, targetX);

  const a = Math.exp(linResult.value);

  const xs = positivePoints.map((p) => p.x);
  const ys = positivePoints.map((p) => p.y);
  const xMean = mean(xs);
  const yMean = mean(ys);
  let ssXY = 0;
  let ssXX = 0;
  for (let i = 0; i < positivePoints.length; i++) {
    ssXY += (xs[i] - xMean) * (Math.log(ys[i]) - mean(logY.map((l) => l.y)));
    ssXX += (xs[i] - xMean) ** 2;
  }
  const b = ssXX === 0 ? 0 : ssXY / ssXX;
  const c = Math.exp(mean(logY.map((l) => l.y)) - b * xMean);
  const predicted = xs.map((x) => c * Math.exp(b * x));
  const rSquared = computeRSquared(ys, predicted);

  return {
    value: a,
    rSquared,
    equation: `y = ${c.toFixed(4)} * e^(${b.toFixed(4)}x)`,
    confidence: rSquared * 100,
    method: 'exponential',
  };
}

export function logarithmic(points: Point[], targetX: number): CalculationResult {
  const positiveXPoints = points.filter((p) => p.x > 0);
  if (positiveXPoints.length < 2) {
    return linear(points, targetX);
  }

  const logX = positiveXPoints.map((p) => ({ x: Math.log(p.x), y: p.y }));
  const linResult = linear(logX, Math.log(targetX > 0 ? targetX : 1));

  const xs = positiveXPoints.map((p) => p.x);
  const ys = positiveXPoints.map((p) => p.y);
  const logXs = xs.map((x) => Math.log(x));
  const xMean = mean(logXs);
  const yMean = mean(ys);

  let ssXY = 0;
  let ssXX = 0;
  for (let i = 0; i < positiveXPoints.length; i++) {
    ssXY += (logXs[i] - xMean) * (ys[i] - yMean);
    ssXX += (logXs[i] - xMean) ** 2;
  }

  const b = ssXX === 0 ? 0 : ssXY / ssXX;
  const a = yMean - b * xMean;
  const predicted = logXs.map((lx) => a + b * lx);
  const rSquared = computeRSquared(ys, predicted);
  const value = targetX > 0 ? a + b * Math.log(targetX) : linResult.value;

  return {
    value,
    rSquared,
    equation: `y = ${a.toFixed(4)} + ${b.toFixed(4)} * ln(x)`,
    confidence: rSquared * 100,
    method: 'logarithmic',
  };
}

function polyFit(points: Point[], degree: number): number[] {
  const n = points.length;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const size = degree + 1;
  const matrix: number[][] = [];
  const rhs: number[] = [];

  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += xs[k] ** (i + j);
      }
      matrix[i][j] = sum;
    }
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += ys[k] * xs[k] ** i;
    }
    rhs[i] = sum;
  }

  for (let i = 0; i < size; i++) {
    const pivot = matrix[i][i];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let j = i; j < size; j++) {
      matrix[i][j] /= pivot;
    }
    rhs[i] /= pivot;
    for (let k = 0; k < size; k++) {
      if (k === i) continue;
      const factor = matrix[k][i];
      for (let j = i; j < size; j++) {
        matrix[k][j] -= factor * matrix[i][j];
      }
      rhs[k] -= factor * rhs[i];
    }
  }

  return rhs;
}

function polyEval(coeffs: number[], x: number): number {
  return coeffs.reduce((sum, c, i) => sum + c * x ** i, 0);
}

export function polynomial(points: Point[], targetX: number, degree: number = 3): CalculationResult {
  const actualDegree = Math.min(degree, points.length - 1);
  if (actualDegree < 1) return linear(points, targetX);

  const coeffs = polyFit(points, actualDegree);
  const predicted = points.map((p) => polyEval(coeffs, p.x));
  const rSquared = computeRSquared(points.map((p) => p.y), predicted);
  const value = polyEval(coeffs, targetX);

  const terms = coeffs
    .map((c, i) => {
      if (Math.abs(c) < 1e-10) return '';
      if (i === 0) return c.toFixed(4);
      if (i === 1) return `${c.toFixed(4)}x`;
      return `${c.toFixed(4)}x^${i}`;
    })
    .filter(Boolean)
    .join(' + ')
    .replace(/\+ -/g, '- ');

  return {
    value,
    rSquared,
    equation: `y = ${terms}`,
    confidence: rSquared * 100,
    method: 'polynomial',
  };
}

export function quadratic(points: Point[], targetX: number): CalculationResult {
  return polynomial(points, targetX, 2);
}

export const methods: Record<string, (points: Point[], targetX: number, degree?: number) => CalculationResult> = {
  linear,
  exponential,
  logarithmic,
  polynomial,
  quadratic,
};
