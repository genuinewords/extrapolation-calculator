import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import type { Point, CalculationResult } from '../utils/extrapolation';
import { methods } from '../utils/extrapolation';
import { validatePoint, sanitizeInput, exportToCSV, downloadCSV, downloadPNG, debounce } from '../utils/validation';
import { methodLabels, demoLabels, demoDatasets, uiLabels } from '../data/calculatorLocales';
import type { MethodKey } from '../data/calculatorLocales';

const ExtrapolationChart = lazy(() => import('./ExtrapolationChart'));

interface Props {
  locale?: string;
  showChart?: boolean;
}

function getDemoLabel(key: string, locale: string): string {
  return demoLabels[locale]?.[key] ?? demoLabels.en[key] ?? key;
}

function L(key: string, locale: string): string {
  const l = locale || 'en';
  return uiLabels[l]?.[key] ?? uiLabels.en[key] ?? key;
}

export default function ExtrapolationCalculator({ locale = 'en', showChart = true }: Props) {
  const [inputRows, setInputRows] = useState<{ x: string; y: string }[]>(demoDatasets.temperature.rows);
  const [method, setMethod] = useState<MethodKey>('linear');
  const [targetX, setTargetX] = useState<string>(demoDatasets.temperature.targetX);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [activeDataset, setActiveDataset] = useState<string>('temperature');
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  const calculate = useCallback(
    (pts: Point[], meth: MethodKey, tgt: string) => {
      const tgtNum = Number(tgt);
      if (isNaN(tgtNum) || !isFinite(tgtNum)) {
        setGeneralError(L('invalid', locale));
        setResult(null);
        return;
      }
      if (pts.length < 2) {
        setGeneralError(L('minPoints', locale));
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

  const loadDataset = (key: string) => {
    const ds = demoDatasets[key];
    if (ds) {
      setInputRows([...ds.rows]);
      setTargetX(ds.targetX);
      setActiveDataset(key);
      setResult(null);
      setGeneralError('');
    }
  };

  const addRow = () => setInputRows([...inputRows, { x: '', y: '' }]);

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
    setActiveDataset('custom');
  };

  const handleExportCSV = () => {
    const validPoints = inputRows
      .map((r) => ({ x: Number(r.x), y: Number(r.y) }))
      .filter((p) => !isNaN(p.x) && !isNaN(p.y));
    const content = exportToCSV(validPoints, result ?? undefined);
    downloadCSV(content, 'extrapolation-result.csv');
  };

  const handleExportPNG = () => downloadPNG(chartRef.current, 'extrapolation-chart.png');

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(L('title', locale), 20, 20);
    doc.setFontSize(12);
    if (result) {
      doc.text(`${L('method', locale)}: ${methodLabels[method][locale] ?? methodLabels[method].en}`, 20, 35);
      doc.text(`${L('extrapolatedValue', locale)}: ${result.value.toFixed(4)}`, 20, 45);
      doc.text(`${L('equation', locale)}: ${result.equation}`, 20, 55);
      doc.text(`${L('rSquared', locale)}: ${(result.rSquared * 100).toFixed(2)}%`, 20, 65);
      doc.text(`${L('confidence', locale)}: ${result.confidence.toFixed(1)}%`, 20, 75);
    }
    if (chartRef.current) {
      const imgData = chartRef.current.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 20, 85, 170, 85);
    }
    doc.save('extrapolation-result.pdf');
  };

  const handleCalculate = () => {
    const validPoints: Point[] = [];
    inputRows.forEach((row) => {
      const validation = validatePoint(row.x, row.y);
      if (validation.valid) validPoints.push({ x: Number(row.x), y: Number(row.y) });
    });
    calculate(validPoints, method, targetX);
  };

  return (
    <div className="calculator-card p-6 md:p-10 max-w-5xl mx-auto" role="application" aria-label={L('title', locale)}>
      {/* Demo Data Buttons */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{L('demoData', locale)}</span>
          <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-700 to-transparent" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(demoDatasets).filter(([k]) => k !== 'custom').map(([key, ds]) => (
            <button
              key={key}
              onClick={() => loadDataset(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeDataset === key
                  ? 'bg-gold-600 text-white shadow-md shadow-gold-500/20'
                  : 'bg-white/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700/80 border border-neutral-200/60 dark:border-neutral-700/60'
              }`}
            >
              {getDemoLabel(key, locale)}
            </button>
          ))}
          <button
            onClick={() => loadDataset('custom')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeDataset === 'custom'
                ? 'bg-gold-700 text-white shadow-md shadow-gold-500/20'
                : 'bg-white/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700/80 border border-neutral-200/60 dark:border-neutral-700/60'
            }`}
          >
            {L('custom', locale)}
          </button>
        </div>
        {activeDataset !== 'custom' && (
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2 italic">{demoDatasets[activeDataset]?.context}</p>
        )}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 calculator-inputs">
        <div>
          <label htmlFor="method-select" className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
            {L('method', locale)}
          </label>
          <select
            id="method-select"
            value={method}
            onChange={(e) => setMethod(e.target.value as MethodKey)}
            className="input-field dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600"
            aria-label={L('method', locale)}
          >
            {Object.entries(methodLabels).map(([key, labelMap]) => (
              <option value={key} key={key}>{labelMap[locale] ?? labelMap.en}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="target-x-input" className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
            {L('targetX', locale)}
          </label>
          <input
            id="target-x-input"
            type="number"
            step="any"
            value={targetX}
            onChange={(e) => setTargetX(e.target.value)}
            className="input-field dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600"
            aria-label={L('targetX', locale)}
          />
        </div>
      </div>

      {/* Interactive Data Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{L('dataPoints', locale)}</span>
            <span className="num-badge">{inputRows.length}</span>
          </div>
          <button
            onClick={addRow}
            className="btn-secondary"
            aria-label={L('addPoint', locale)}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            {L('addPoint', locale)}
          </button>
        </div>

        <div className="bg-white/50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 overflow-hidden backdrop-blur-sm">
          {/* Desktop header */}
          <div className="hidden md:grid data-table-header px-4 py-3 bg-neutral-100/70 dark:bg-neutral-800/70 border-b border-neutral-200/60 dark:border-neutral-700/60 backdrop-blur-sm" style={{ gridTemplateColumns: '40px 1fr 1fr 44px' }}>
            <span className="text-center">#</span>
            <span className="px-4">X</span>
            <span className="px-4">Y</span>
            <span></span>
          </div>
          {/* Mobile header */}
          <div className="md:hidden px-4 py-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-neutral-200/60 dark:border-neutral-700/60">
            {L('dataPoints', locale)}
          </div>
          <div className="p-2 space-y-1">
            {inputRows.map((row, i) => (
              <div
                key={i}
                className="flex flex-col md:grid gap-4 md:gap-6 items-start md:items-center px-2 py-3 rounded-xl transition-all duration-200 hover:bg-white/60 dark:hover:bg-neutral-800/40"
                style={{ gridTemplateColumns: '40px 1fr 1fr 44px' }}
              >
                <span className="num-badge text-xs scale-90 self-start md:self-center">{i + 1}</span>
                <div className="w-full md:border-r-2 md:border-gold-500/20 md:pr-6 px-4">
                  <input
                    type="number"
                    step="any"
                    value={row.x}
                    onChange={(e) => updateRow(i, 'x', e.target.value)}
                    aria-label={`Point ${i + 1} X value`}
                    className={errors[i] ? 'input-field-error py-2 w-full dark:bg-neutral-800 dark:text-neutral-100 dark:border-red-500' : 'input-field py-2 w-full dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600'}
                    placeholder="X"
                  />
                </div>
                <div className="w-full px-4 md:pl-6">
                  <input
                    type="number"
                    step="any"
                    value={row.y}
                    onChange={(e) => updateRow(i, 'y', e.target.value)}
                    aria-label={`Point ${i + 1} Y value`}
                    className={errors[i] ? 'input-field-error py-2 w-full dark:bg-neutral-800 dark:text-neutral-100 dark:border-red-500' : 'input-field py-2 w-full dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600'}
                    placeholder="Y"
                  />
                </div>
                <button
                  onClick={() => removeRow(i)}
                  disabled={inputRows.length <= 2}
                  className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 self-end md:self-center"
                  aria-label={`${L('remove', locale)} point ${i + 1}`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        className="w-full py-5 px-10 rounded-2xl font-bold text-xl text-white tracking-wide bg-gradient-to-r from-gold-700 via-gold-500 to-gold-400 shadow-xl shadow-gold-500/30 hover:shadow-2xl hover:shadow-gold-500/50 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:outline-none border border-white/10 dark:border-gold-500/30 mb-4 relative overflow-hidden group"
        aria-label={L('calculate', locale)}
      >
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{animation: 'shimmer 2s infinite'}} />
        <span className="relative z-10">{L('calculate', locale)}</span>
      </button>

      {generalError && (
        <div className="mt-4 p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200/60 dark:border-red-700/60 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-center gap-2 animate-fade-in-up backdrop-blur-sm" role="alert">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {generalError}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{L('result', locale)}</span>
            <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-700 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="result-card-accent">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">{L('extrapolatedValue', locale)}</p>
              <p className="text-2xl font-bold text-gold-600 dark:text-gold-400 font-serif">{result.value.toFixed(4)}</p>
            </div>
            <div className="result-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">{L('rSquared', locale)}</p>
              <p className="text-2xl font-bold text-gold-500">{(result.rSquared * 100).toFixed(2)}%</p>
            </div>
            <div className="result-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">{L('confidence', locale)}</p>
              <p className="text-2xl font-bold text-gold-400">{result.confidence.toFixed(1)}%</p>
            </div>
            <div className="result-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">{L('equation', locale)}</p>
              <p className="text-sm font-mono text-neutral-800 dark:text-neutral-200 break-all">{result.equation}</p>
            </div>
          </div>

          {showChart && (
            <div className="mb-6">
              <Suspense fallback={<div className="h-64 bg-white/40 dark:bg-neutral-800/40 rounded-2xl animate-pulse flex items-center justify-center text-neutral-400 backdrop-blur-sm border border-neutral-200/40 dark:border-neutral-700/40">{L('chartLoading', locale)}</div>}>
                <ExtrapolationChart
                  points={inputRows.map((r) => ({ x: Number(r.x), y: Number(r.y) })).filter((p) => !isNaN(p.x) && !isNaN(p.y))}
                  result={result}
                  targetX={Number(targetX) || 0}
                  method={method}
                  ref={chartRef}
                />
              </Suspense>
            </div>
          )}

          {/* Export Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-6 mt-6">
            <button onClick={handleExportCSV} className="btn-export-csv" aria-label={L('csv', locale)}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {L('csv', locale)}
            </button>
            <button onClick={handleExportPNG} className="btn-export-png" aria-label={L('png', locale)}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {L('png', locale)}
            </button>
            <button onClick={handleExportPDF} className="btn-export-pdf" aria-label={L('pdf', locale)}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              {L('pdf', locale)}
            </button>
          </div>
        </div>
      )}

      <noscript>
        <div className="mt-4 p-4 bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200/60 dark:border-yellow-700/60 rounded-xl text-sm text-yellow-800 dark:text-yellow-200 backdrop-blur-sm">
          {L('noscript', locale)}
        </div>
      </noscript>
    </div>
  );
}
