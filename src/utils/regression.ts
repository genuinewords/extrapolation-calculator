export interface RegressionResult {
  equation: string;
  coefficients: number[];
  rSquared: number;
  predictedValue: number;
  steps: string[];
}

function transpose(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = [];
  for (let j = 0; j < cols; j++) {
    result.push([]);
    for (let i = 0; i < rows; i++) {
      result[j].push(matrix[i][j]);
    }
  }
  return result;
}

function multiply(a: number[][], b: number[][]): number[][] {
  const aRows = a.length;
  const aCols = a[0].length;
  const bCols = b[0].length;
  const result: number[][] = [];
  for (let i = 0; i < aRows; i++) {
    result.push([]);
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i].push(sum);
    }
  }
  return result;
}

function invert3x3(m: number[][]): number[][] {
  const [a, b, c, d, e, f, g, h, i] = [m[0][0], m[0][1], m[0][2], m[1][0], m[1][1], m[1][2], m[2][0], m[2][1], m[2][2]];

  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-10) throw new Error('Singular matrix: cannot compute inverse. The data may be collinear or insufficient.');

  const invDet = 1 / det;
  return [
    [(e * i - f * h) * invDet, (c * h - b * i) * invDet, (b * f - c * e) * invDet],
    [(f * g - d * i) * invDet, (a * i - c * g) * invDet, (c * d - a * f) * invDet],
    [(d * h - e * g) * invDet, (b * g - a * h) * invDet, (a * e - b * d) * invDet],
  ];
}

export function simpleRegression(
  points: { x: number; y: number }[],
  predictX: number
): RegressionResult {
  if (points.length < 2) throw new Error('At least 2 data points required for regression.');

  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = meanY - slope * meanX;

  if (!isFinite(slope) || !isFinite(intercept)) throw new Error('Cannot compute regression: all X values are identical.');

  const ssTotal = sumY2 - n * meanY * meanY;
  const ssResidual = points.reduce((sum, p) => sum + Math.pow(p.y - (intercept + slope * p.x), 2), 0);
  const rSquared = ssTotal === 0 ? 1 : 1 - ssResidual / ssTotal;

  const predictedValue = intercept + slope * predictX;

  const steps = [
    `n = ${n}`,
    `Mean X = ${meanX.toFixed(4)}, Mean Y = ${meanY.toFixed(4)}`,
    `Slope (β₁) = (${n}×Σxy - Σx×Σy) / (${n}×Σx² - (Σx)²) = ${slope.toFixed(6)}`,
    `Intercept (β₀) = Mean Y - Slope × Mean X = ${intercept.toFixed(6)}`,
    `R² = ${(rSquared * 100).toFixed(2)}%`,
    `Predicted y at x = ${predictX}: y = ${predictedValue.toFixed(6)}`,
  ];

  const equation = `y = ${intercept.toFixed(4)} + ${slope.toFixed(4)}x`;

  return {
    equation,
    coefficients: [intercept, slope],
    rSquared,
    predictedValue,
    steps,
  };
}

export interface MultiPoint {
  x1: number;
  x2: number;
  y: number;
}

export function multipleRegression(
  points: MultiPoint[],
  predictX1: number,
  predictX2: number
): RegressionResult {
  if (points.length < 3) throw new Error('At least 3 data points required for multiple regression.');

  const n = points.length;
  const X: number[][] = points.map(p => [1, p.x1, p.x2]);
  const Y: number[][] = points.map(p => [p.y]);

  const Xt = transpose(X);
  const XtX = multiply(Xt, X);
  const XtY = multiply(Xt, Y);

  let beta: number[][];
  try {
    const inv = invert3x3(XtX);
    beta = multiply(inv, XtY);
  } catch (e) {
    throw new Error('Singular matrix: cannot compute regression. The independent variables may be collinear or insufficient variation exists.');
  }

  const b0 = beta[0][0];
  const b1 = beta[1][0];
  const b2 = beta[2][0];

  const meanY = Y.reduce((s, row) => s + row[0], 0) / n;
  const ssTotal = Y.reduce((s, row) => s + Math.pow(row[0] - meanY, 2), 0);
  const ssResidual = points.reduce((s, p) => s + Math.pow(p.y - (b0 + b1 * p.x1 + b2 * p.x2), 2), 0);
  const rSquared = ssTotal === 0 ? 1 : 1 - ssResidual / ssTotal;

  const predictedValue = b0 + b1 * predictX1 + b2 * predictX2;

  const steps = [
    `n = ${n}`,
    `β₀ (intercept) = ${b0.toFixed(6)}`,
    `β₁ (coefficient for x₁) = ${b1.toFixed(6)}`,
    `β₂ (coefficient for x₂) = ${b2.toFixed(6)}`,
    `R² = ${(rSquared * 100).toFixed(2)}%`,
    `Predicted y at (x₁=${predictX1}, x₂=${predictX2}): y = ${predictedValue.toFixed(6)}`,
  ];

  const sign1 = b1 >= 0 ? ' + ' : ' - ';
  const sign2 = b2 >= 0 ? ' + ' : ' - ';
  const equation = `y = ${b0.toFixed(4)}${sign1}${Math.abs(b1).toFixed(4)}x₁${sign2}${Math.abs(b2).toFixed(4)}x₂`;

  return {
    equation,
    coefficients: [b0, b1, b2],
    rSquared,
    predictedValue,
    steps,
  };
}

export const regressionMethods: Record<string, (...args: never[]) => RegressionResult> = {
  simple: simpleRegression as never,
  multiple: multipleRegression as never,
};
