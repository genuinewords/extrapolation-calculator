import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import type { Point, CalculationResult } from '../utils/extrapolation';
import { methods } from '../utils/extrapolation';
import { validatePoint, sanitizeInput, exportToCSV, downloadCSV, downloadPNG, debounce } from '../utils/validation';

const ExtrapolationChart = lazy(() => import('./ExtrapolationChart'));

type MethodKey = 'linear' | 'exponential' | 'logarithmic' | 'polynomial' | 'quadratic';

interface Props {
  locale?: string;
}

const methodLabels: Record<MethodKey, Record<string, string>> = {
  linear: { en: 'Linear', es: 'Lineal', fr: 'Linéaire', de: 'Linear', ja: '線形', ar: 'خطي' },
  exponential: { en: 'Exponential', es: 'Exponencial', fr: 'Exponentielle', de: 'Exponentiell', ja: '指数', ar: 'أسي' },
  logarithmic: { en: 'Logarithmic', es: 'Logarítmico', fr: 'Logarithmique', de: 'Logarithmisch', ja: '対数', ar: 'لوغاريتمي' },
  polynomial: { en: 'Polynomial', es: 'Polinomial', fr: 'Polynomiale', de: 'Polynomiell', ja: '多項式', ar: 'كثير الحدود' },
  quadratic: { en: 'Quadratic', es: 'Cuadrático', fr: 'Quadratique', de: 'Quadratisch', ja: '二次', ar: 'تربيعي' },
};

const labels: Record<string, Record<string, string>> = {
  calc: {
    en: { title: 'Extrapolation Calculator', subtitle: 'Predict future values from your data', method: 'Method', targetX: 'Target X', calculate: 'Calculate', addPoint: 'Add Data Point', remove: 'Remove', result: 'Result', equation: 'Equation', rSquared: 'R² Score', confidence: 'Confidence', export: 'Export', csv: 'Export CSV', png: 'Export PNG', pdf: 'Export PDF', invalid: 'Please enter valid numbers', minPoints: 'At least 2 data points required' },
  },
};

function getLabel(key: string, locale: string): string {
  const l = locale || 'en';
  return labels.calc[l]?.[key] ?? labels.calc.en[key] ?? key;
}

export default function ExtrapolationCalculator({ locale = 'en' }: Props) {
  const [points, setPoints] = useState<Point[]>([
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
  ]);
  const [inputRows, setInputRows] = useState<{ x: string; y: string }[]>([
    { x: '1', y: '2' },
    { x: '2', y: '4' },
    { x: '3', y: '6' },
  ]);
  const [method, setMethod] = useState<MethodKey>('linear');
  const [targetX, setTargetX] = useState<string>('5');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  const calculate = useCallback(
    (pts: Point[], meth: MethodKey, tgt: string) => {
      const tgtNum = Number(tgt);
      if (isNaN(tgtNum) || !isFinite(tgtNum)) {
        setGeneralError(getLabel('invalid', locale));
        setResult(null);
        return;
      }
      if (pts.length < 2) {
        setGeneralError(getLabel('minPoints', locale));
        setResult(null);
        return;
      }
      setGeneralError('');
      const fn = methods[meth];
      const res = fn(pts, tgtNum, meth === 'polynomial' ? 3 : undefined);
      setResult(res);
    },
    [locale]
  );

  const debouncedCalculate = useCallback(
    debounce((pts: Point[], meth: MethodKey, tgt: string) => {
      calculate(pts, meth, tgt);
    }, 300),
    [calculate]
  );

  useEffect(() => {
    const validPoints: Point[] = [];
    let hasErrors = false;
    const newErrors: Record<number, string> = {};

    inputRows.forEach((row, i) => {
      const validation = validatePoint(row.x, row.y);
      if (!validation.valid) {
        newErrors[i] = validation.error ?? 'Invalid';
        hasErrors = true;
      } else {
        validPoints.push({ x: Number(row.x), y: Number(row.y) });
      }
    });

    setErrors(newErrors);
    if (!hasErrors && validPoints.length >= 2) {
      debouncedCalculate(validPoints, method, targetX);
    }
  }, [inputRows, method, targetX, debouncedCalculate]);

  const addRow = () => {
    setInputRows([...inputRows, { x: '', y: '' }]);
  };

  const removeRow = (index: number) => {
    if (inputRows.length <= 2) return;
    const newRows = inputRows.filter((_, i) => i !== index);
    setInputRows(newRows);
    setErrors((prev) => {
      const next: Record<number, string> = {};
      Object.keys(prev).forEach((k) => {
        const ki = Number(k);
        if (ki < index) next[ki] = prev[ki];
        else if (ki > index) next[ki - 1] = prev[ki];
      });
      return next;
    });
  };

  const updateRow = (index: number, field: 'x' | 'y', value: string) => {
    const sanitized = sanitizeInput(value);
    const newRows = [...inputRows];
    newRows[index] = { ...newRows[index], [field]: sanitized };
    setInputRows(newRows);
  };

  const handleExportCSV = () => {
    const validPoints = inputRows
      .map((r) => ({ x: Number(r.x), y: Number(r.y) }))
      .filter((p) => !isNaN(p.x) && !isNaN(p.y));
    const content = exportToCSV(validPoints, result ?? undefined);
    downloadCSV(content, 'extrapolation-result.csv');
  };

  const handleExportPNG = () => {
    downloadPNG(chartRef.current, 'extrapolation-chart.png');
  };

  const handleCalculate = () => {
    const validPoints: Point[] = [];
    inputRows.forEach((row) => {
      const validation = validatePoint(row.x, row.y);
      if (validation.valid) {
        validPoints.push({ x: Number(row.x), y: Number(row.y) });
      }
    });
    calculate(validPoints, method, targetX);
  };

  return (
    <div class="calculator-card p-6 md:p-8 max-w-4xl mx-auto" role="application" aria-label={getLabel('title', locale)}>
      <div class="text-center mb-8">
        <h1 class="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">{getLabel('title', locale)}</h1>
        <p class="text-neutral-500">{getLabel('subtitle', locale)}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 calculator-inputs">
        <div>
          <label for="method-select" class="block text-sm font-medium text-neutral-700 mb-2">
            {getLabel('method', locale)}
          </label>
          <select
            id="method-select"
            value={method}
            onChange={(e) => setMethod(e.target.value as MethodKey)}
            class="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            aria-label={getLabel('method', locale)}
          >
            {Object.entries(methodLabels).map(([key, labelMap]) => (
              <option value={key}>{labelMap[locale] ?? labelMap.en}</option>
            ))}
          </select>
        </div>

        <div>
          <label for="target-x-input" class="block text-sm font-medium text-neutral-700 mb-2">
            {getLabel('targetX', locale)}
          </label>
          <input
            id="target-x-input"
            type="number"
            step="any"
            value={targetX}
            onChange={(e) => setTargetX(e.target.value)}
            class="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            aria-label={getLabel('targetX', locale)}
          />
        </div>
      </div>

      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-medium text-neutral-700">Data Points</h2>
          <button
            onClick={addRow}
            class="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
            aria-label={getLabel('addPoint', locale)}
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            {getLabel('addPoint', locale)}
          </button>
        </div>

        <div class="space-y-2" role="table" aria-label="Data points table">
          <div class="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-neutral-500 px-1" role="row">
            <span role="columnheader">X</span>
            <span role="columnheader">Y</span>
            <span class="w-8" role="columnheader"></span>
          </div>
          {inputRows.map((row, i) => (
            <div class="grid grid-cols-[1fr_1fr_auto] gap-2" role="row" key={i}>
              <input
                type="number"
                step="any"
                value={row.x}
                onChange={(e) => updateRow(i, 'x', e.target.value)}
                aria-label={`Point ${i + 1} X value`}
                class={`border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary ${errors[i] ? 'border-red-400 bg-red-50' : 'border-neutral-200'}`}
                role="cell"
              />
              <input
                type="number"
                step="any"
                value={row.y}
                onChange={(e) => updateRow(i, 'y', e.target.value)}
                aria-label={`Point ${i + 1} Y value`}
                class={`border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary ${errors[i] ? 'border-red-400 bg-red-50' : 'border-neutral-200'}`}
                role="cell"
              />
              <button
                onClick={() => removeRow(i)}
                disabled={inputRows.length <= 2}
                class="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-neutral-100"
                aria-label={`${getLabel('remove', locale)} point ${i + 1}`}
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleCalculate}
        class="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={getLabel('calculate', locale)}
      >
        {getLabel('calculate', locale)}
      </button>

      {generalError && (
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
          {generalError}
        </div>
      )}

      {result && (
        <div class="mt-6 p-6 bg-neutral-50 rounded-xl border border-neutral-200" role="region" aria-label={getLabel('result', locale)}>
          <h2 class="text-lg font-semibold text-neutral-900 mb-4">{getLabel('result', locale)}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-white p-4 rounded-lg border border-neutral-200">
              <p class="text-xs text-neutral-500 mb-1">Extrapolated Value</p>
              <p class="text-xl font-bold text-primary">{result.value.toFixed(4)}</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-neutral-200">
              <p class="text-xs text-neutral-500 mb-1">{getLabel('equation', locale)}</p>
              <p class="text-sm font-mono text-neutral-800 break-all">{result.equation}</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-neutral-200">
              <p class="text-xs text-neutral-500 mb-1">{getLabel('rSquared', locale)}</p>
              <p class="text-xl font-bold text-secondary">{(result.rSquared * 100).toFixed(2)}%</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-neutral-200">
              <p class="text-xs text-neutral-500 mb-1">{getLabel('confidence', locale)}</p>
              <p class="text-xl font-bold text-accent">{result.confidence.toFixed(1)}%</p>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleExportCSV}
              class="inline-flex items-center gap-1 px-4 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              aria-label={getLabel('csv', locale)}
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              CSV
            </button>
            <button
              onClick={handleExportPNG}
              class="inline-flex items-center gap-1 px-4 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              aria-label={getLabel('png', locale)}
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              PNG
            </button>
          </div>
        </div>
      )}

      <div class="mt-8" aria-label="Extrapolation chart">
        <Suspense fallback={<div class="h-64 bg-neutral-100 rounded-xl animate-pulse flex items-center justify-center text-neutral-400">Loading chart...</div>}>
          <ExtrapolationChart
            points={inputRows
              .map((r) => ({ x: Number(r.x), y: Number(r.y) }))
              .filter((p) => !isNaN(p.x) && !isNaN(p.y))}
            result={result}
            targetX={Number(targetX) || 0}
            method={method}
            ref={chartRef}
          />
        </Suspense>
      </div>

      <noscript>
        <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          JavaScript is required for the interactive calculator. Please enable JavaScript to use this tool.
        </div>
      </noscript>
    </div>
  );
}
