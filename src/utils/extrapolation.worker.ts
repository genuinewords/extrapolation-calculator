import { linear, exponential, logarithmic, polynomial, quadratic } from './extrapolation';
import type { Point, CalculationResult } from './extrapolation';

export type WorkerMethod = 'linear' | 'exponential' | 'logarithmic' | 'polynomial' | 'quadratic';

export interface WorkerRequest {
  id: string;
  method: WorkerMethod;
  points: Point[];
  targetX: number;
  degree?: number;
}

export interface WorkerResponse {
  id: string;
  result: CalculationResult;
}

const methodMap: Record<WorkerMethod, (points: Point[], targetX: number, degree?: number) => CalculationResult> = {
  linear,
  exponential,
  logarithmic,
  polynomial,
  quadratic,
};

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, method, points, targetX, degree } = e.data;
  const fn = methodMap[method];
  const result = fn(points, targetX, degree);
  const response: WorkerResponse = { id, result };
  self.postMessage(response);
};
