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
import type { RegressionResult } from '../utils/regression';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  points: { x: number; y: number }[];
  result: RegressionResult | null;
  predictX: number;
  method: 'simple' | 'multiple';
}

const RegressionChart = forwardRef<HTMLCanvasElement, Props>(function RegressionChart(
  { points, result, predictX, method },
  ref
) {
  const chartRef = useRef<ChartJS<'scatter'>>(null);

  useEffect(() => {
    if (ref && 'current' in ref) {
      ref.current = chartRef.current?.canvas ?? null;
    }
  }, [ref, chartRef.current]);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const tooltipBg = isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(24, 24, 27, 0.9)';

  if (points.length < 2) {
    return (
      <div className="h-64 bg-white/40 dark:bg-neutral-800/40 rounded-2xl flex items-center justify-center text-neutral-400 dark:text-neutral-500 border border-neutral-200/40 dark:border-neutral-700/40 backdrop-blur-sm">
        Add at least 2 data points to see the chart
      </div>
    );
  }

  const linePoints: { x: number; y: number }[] = [];
  if (result && result.coefficients.length >= 2 && method === 'simple') {
    const [intercept, slope] = result.coefficients;
    const xMin = Math.min(...points.map((p) => p.x));
    const xMax = Math.max(...points.map((p) => p.x));
    const xRange = xMax - xMin || 1;
    const lineStart = xMin - xRange * 0.1;
    const lineEnd = xMax + xRange * 0.1;
    const step = (lineEnd - lineStart) / 100;
    for (let x = lineStart; x <= lineEnd; x += step) {
      linePoints.push({ x, y: intercept + slope * x });
    }
  }

  const predictedPoint = result
    ? [{ x: predictX, y: result.predictedValue }]
    : [];

  const data = {
    datasets: [
      {
        label: 'Data Points',
        data: points.map((p) => ({ x: p.x, y: p.y })),
        backgroundColor: '#B8860B',
        borderColor: '#B8860B',
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: false,
      },
      {
        label: 'Regression Line',
        data: linePoints,
        borderColor: '#D4A853',
        backgroundColor: 'rgba(212, 168, 83, 0.1)',
        pointRadius: 0,
        showLine: true,
        borderWidth: 2,
        fill: false,
        tension: 0,
      },
      {
        label: 'Predicted Value',
        data: predictedPoint,
        backgroundColor: '#E8C07A',
        borderColor: '#E8C07A',
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
          color: textColor,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleFont: { size: 12, color: '#fff' },
        bodyFont: { size: 12, color: '#fff' },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'X', font: { size: 12, color: textColor } },
        grid: { color: gridColor },
        ticks: { color: textColor },
        border: { color: gridColor },
      },
      y: {
        title: { display: true, text: 'Y', font: { size: 12, color: textColor } },
        grid: { color: gridColor },
        ticks: { color: textColor },
        border: { color: gridColor },
      },
    },
  };

  return (
    <div className="bg-white/60 dark:bg-black/40 rounded-2xl border border-neutral-200/40 dark:border-neutral-700/40 p-4 backdrop-blur-sm">
      <Scatter ref={chartRef} data={data} options={options} />
    </div>
  );
});

export default RegressionChart;
