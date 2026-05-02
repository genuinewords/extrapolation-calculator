import { useEffect, useRef, forwardRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import type { Point } from '../utils/extrapolation';
import type { CalculationResult } from '../utils/extrapolation';
import { methods } from '../utils/extrapolation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  points: Point[];
  result: CalculationResult | null;
  targetX: number;
  method: string;
}

const ExtrapolationChart = forwardRef<HTMLCanvasElement, Props>(function ExtrapolationChart(
  { points, result, targetX, method },
  ref
) {
  const chartRef = useRef<ChartJS<'scatter'>>(null);

  useEffect(() => {
    if (ref && 'current' in ref) {
      ref.current = chartRef.current?.canvas ?? null;
    }
  }, [ref, chartRef.current]);

  if (points.length < 2) {
    return (
      <div className="h-64 bg-neutral-50 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400">
        Add at least 2 data points to see the chart
      </div>
    );
  }

  const xMin = Math.min(...points.map((p) => p.x), targetX);
  const xMax = Math.max(...points.map((p) => p.x), targetX);
  const xRange = xMax - xMin || 1;
  const curveStart = xMin - xRange * 0.1;
  const curveEnd = xMax + xRange * 0.1;
  const step = (curveEnd - curveStart) / 100;

  const curvePoints: Point[] = [];
  const currentMethod = methods[method];
  if (currentMethod && result) {
    for (let x = curveStart; x <= curveEnd; x += step) {
      try {
        const res = currentMethod(points, x, method === 'polynomial' ? 3 : undefined);
        if (isFinite(res.value)) {
          curvePoints.push({ x, y: res.value });
        }
      } catch {
        // skip non-finite values
      }
    }
  }

  const data = {
    datasets: [
      {
        label: 'Data Points',
        data: points.map((p) => ({ x: p.x, y: p.y })),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: false,
      },
      {
        label: 'Fit Curve',
        data: curvePoints,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        pointRadius: 0,
        showLine: true,
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Extrapolated Point',
        data: result ? [{ x: targetX, y: result.value }] : [],
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: 'triangle' as const,
        showLine: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 12, family: 'Inter, system-ui, sans-serif' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'X', font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      y: {
        title: { display: true, text: 'Y', font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <Scatter ref={chartRef} data={data} options={options} />
    </div>
  );
});

export default ExtrapolationChart;
