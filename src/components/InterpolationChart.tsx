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
import type { Point } from '../utils/interpolation';
import { interpolationMethods } from '../utils/interpolation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type InterpMethod = 'linear' | 'lagrange' | 'spline';

interface Props {
  points: Point[];
  interpolatedX: number;
  interpolatedY: number;
  method: InterpMethod;
}

const InterpolationChart = forwardRef<HTMLCanvasElement, Props>(function InterpolationChart(
  { points, interpolatedX, interpolatedY, method },
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

  const xMin = Math.min(...points.map((p) => p.x));
  const xMax = Math.max(...points.map((p) => p.x));
  const xRange = xMax - xMin || 1;
  const curveStart = xMin - xRange * 0.05;
  const curveEnd = xMax + xRange * 0.05;
  const step = (curveEnd - curveStart) / 100;

  const curvePoints: Point[] = [];
  const fn = interpolationMethods[method];
  if (fn) {
    for (let x = curveStart; x <= curveEnd; x += step) {
      try {
        const res = fn(points, x);
        if (isFinite(res.value)) {
          curvePoints.push({ x, y: res.value });
        }
      } catch {
        // skip
      }
    }
  }

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
        label: 'Interpolation Curve',
        data: curvePoints,
        borderColor: '#D4A853',
        backgroundColor: 'rgba(212, 168, 83, 0.1)',
        pointRadius: 0,
        showLine: true,
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Interpolated Point',
        data: [{ x: interpolatedX, y: interpolatedY }],
        backgroundColor: '#E8C07A',
        borderColor: '#E8C07A',
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: 'rectRot' as const,
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

export default InterpolationChart;
