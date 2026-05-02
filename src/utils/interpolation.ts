export interface Point {
  x: number;
  y: number;
}

export interface InterpolationResult {
  value: number;
  method: string;
  steps: string[];
}

export function linearInterpolation(points: Point[], targetX: number): InterpolationResult {
  if (points.length < 2) throw new Error('At least 2 points required for linear interpolation');

  const sorted = [...points].sort((a, b) => a.x - b.x);

  const duplicateX = sorted.find((p, i) => i > 0 && p.x === sorted[i - 1].x);
  if (duplicateX) throw new Error('Duplicate X values detected. Each X must be unique.');

  let p1: Point, p2: Point;

  if (targetX <= sorted[0].x) {
    p1 = sorted[0];
    p2 = sorted[1];
  } else if (targetX >= sorted[sorted.length - 1].x) {
    p1 = sorted[sorted.length - 2];
    p2 = sorted[sorted.length - 1];
  } else {
    let idx = 0;
    while (idx < sorted.length - 1 && sorted[idx + 1].x < targetX) idx++;
    p1 = sorted[idx];
    p2 = sorted[idx + 1];
  }

  const slope = (p2.y - p1.y) / (p2.x - p1.x);
  const value = p1.y + slope * (targetX - p1.x);

  const steps = [
    `Using points (${p1.x}, ${p1.y}) and (${p2.x}, ${p2.y})`,
    `Slope = (${p2.y} - ${p1.y}) / (${p2.x} - ${p1.x}) = ${slope.toFixed(6)}`,
    `y = ${p1.y} + ${slope.toFixed(6)} × (${targetX} - ${p1.x})`,
    `y = ${value.toFixed(6)}`,
  ];

  return { value, method: 'Linear Interpolation', steps };
}

export function lagrangeInterpolation(points: Point[], targetX: number): InterpolationResult {
  if (points.length < 2) throw new Error('At least 2 points required for Lagrange interpolation');
  if (points.length > 5) throw new Error('Maximum 5 points allowed for Lagrange interpolation');

  const duplicateX = points.find((p, i) => points.some((q, j) => i !== j && p.x === q.x));
  if (duplicateX) throw new Error('Duplicate X values detected. Each X must be unique.');

  const n = points.length;
  let result = 0;
  const stepDetails: string[] = [];

  for (let i = 0; i < n; i++) {
    let basis = 1;
    const numerators: string[] = [];
    const denominators: string[] = [];

    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const num = targetX - points[j].x;
        const den = points[i].x - points[j].x;
        basis *= num / den;
        numerators.push(`(${targetX} - ${points[j].x})`);
        denominators.push(`(${points[i].x} - ${points[j].x})`);
      }
    }

    const termValue = points[i].y * basis;
    result += termValue;
    stepDetails.push(
      `L${i}(x) = ${points[i].y} × [${numerators.join(' × ')}] / [${denominators.join(' × ')}] = ${termValue.toFixed(6)}`
    );
  }

  const steps = [
    `Lagrange polynomial of degree ${n - 1} through ${n} points`,
    ...stepDetails,
    `Sum of all terms = ${result.toFixed(6)}`,
  ];

  return { value: result, method: 'Lagrange Polynomial Interpolation', steps };
}

export function cubicSplineInterpolation(points: Point[], targetX: number): InterpolationResult {
  if (points.length < 2) throw new Error('At least 2 points required for cubic spline interpolation');

  const sorted = [...points].sort((a, b) => a.x - b.x);
  const n = sorted.length;

  const duplicateX = sorted.find((p, i) => i > 0 && p.x === sorted[i - 1].x);
  if (duplicateX) throw new Error('Duplicate X values detected. Each X must be unique.');

  if (targetX < sorted[0].x || targetX > sorted[n - 1].x) {
    throw new Error('Target X is outside the interpolation range for cubic spline.');
  }

  if (n === 2) {
    return linearInterpolation(points, targetX);
  }

  const h: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(sorted[i + 1].x - sorted[i].x);
  }

  const alpha: number[] = [0];
  for (let i = 1; i < n - 1; i++) {
    alpha.push(
      (3 / h[i]) * (sorted[i + 1].y - sorted[i].y) -
      (3 / h[i - 1]) * (sorted[i].y - sorted[i - 1].y)
    );
  }

  const l: number[] = [1];
  const mu: number[] = [0];
  const z: number[] = [0];

  for (let i = 1; i < n - 1; i++) {
    l.push(2 * (sorted[i + 1].x - sorted[i - 1].x) - h[i - 1] * mu[i - 1]);
    mu.push(h[i] / l[i]);
    z.push((alpha[i] - h[i - 1] * z[i - 1]) / l[i]);
  }

  l.push(1);
  z.push(0);

  const c: number[] = new Array(n).fill(0);
  const b: number[] = new Array(n - 1);
  const d: number[] = new Array(n - 1);

  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] =
      (sorted[j + 1].y - sorted[j].y) / h[j] -
      (h[j] * (c[j + 1] + 2 * c[j])) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }

  let idx = 0;
  while (idx < n - 2 && sorted[idx + 1].x < targetX) idx++;

  const dx = targetX - sorted[idx].x;
  const value =
    sorted[idx].y +
    b[idx] * dx +
    c[idx] * dx * dx +
    d[idx] * dx * dx * dx;

  const steps = [
    `Natural cubic spline through ${n} points`,
    `Target falls in interval [${sorted[idx].x}, ${sorted[idx + 1].x}]`,
    `S(x) = ${sorted[idx].y.toFixed(4)} + ${b[idx].toFixed(4)}·(x - ${sorted[idx].x}) + ${c[idx].toFixed(4)}·(x - ${sorted[idx].x})² + ${d[idx].toFixed(4)}·(x - ${sorted[idx].x})³`,
    `S(${targetX}) = ${value.toFixed(6)}`,
  ];

  return { value, method: 'Natural Cubic Spline Interpolation', steps };
}

export const interpolationMethods: Record<string, (points: Point[], targetX: number) => InterpolationResult> = {
  linear: linearInterpolation,
  lagrange: lagrangeInterpolation,
  spline: cubicSplineInterpolation,
};
