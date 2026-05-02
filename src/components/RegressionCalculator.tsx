import { useState, useCallback, useEffect } from 'react';
import { simpleRegression, multipleRegression } from '../utils/regression';
import type { RegressionResult } from '../utils/regression';
import { sanitizeInput, debounce } from '../utils/validation';

type RegMethod = 'simple' | 'multiple';

interface Props {
  locale?: string;
}

const methodLabels: Record<RegMethod, Record<string, string>> = {
  simple: { en: 'Simple Regression', hi: 'सरल प्रतिगमन', es: 'Regresión Simple', ru: 'Простая Регрессия', fr: 'Régression Simple', de: 'Einfache Regression', it: 'Regressione Semplice', pt: 'Regressão Simples', bn: 'সরল নির্ভরণ', ja: '単回帰', ko: '단순 회귀', ms: 'Regresi Ringkas', pl: 'Regresja Prosta', id: 'Regresi Sederhana', ar: 'انحدار بسيط', bg: 'Проста Регресия', tr: 'Basit Regresyon', sv: 'Enkel Regression' },
  multiple: { en: 'Multiple Regression', hi: 'बहु प्रतिगमन', es: 'Regresión Múltiple', ru: 'Множественная Регрессия', fr: 'Régression Multiple', de: 'Mehrfache Regression', it: 'Regressione Multipla', pt: 'Regressão Múltipla', bn: 'বহু নির্ভরণ', ja: '重回帰', ko: '다중 회귀', ms: 'Regresi Berganda', pl: 'Regresja Wielokrotna', id: 'Regresi Berganda', ar: 'انحدار متعدد', bg: 'Множествена Регресия', tr: 'Çoklu Regresyon', sv: 'Multipel Regression' },
};

const ui: Record<string, Record<string, string>> = {
  en: { title: 'Regression Calculator', subtitle: 'Analyze relationships between variables', method: 'Method', predictX: 'Predict at X', predictX1: 'Predict at X₁', predictX2: 'Predict at X₂', calculate: 'Calculate', addPoint: 'Add Point', remove: 'Remove', result: 'Result', equation: 'Equation', rSquared: 'R² Score', predictedValue: 'Predicted Value', steps: 'Steps', dataPoints: 'Data Points', invalid: 'Please enter valid numbers', minPoints: 'At least 2 data points required for simple, 3 for multiple', singularMatrix: 'Singular matrix: variables may be collinear' },
  es: { title: 'Calculadora de Regresión', subtitle: 'Analiza relaciones entre variables', method: 'Método', predictX: 'Predecir en X', predictX1: 'Predecir en X₁', predictX2: 'Predecir en X₂', calculate: 'Calcular', addPoint: 'Agregar Punto', remove: 'Eliminar', result: 'Resultado', equation: 'Ecuación', rSquared: 'Puntuación R²', predictedValue: 'Valor Predicho', steps: 'Pasos', dataPoints: 'Puntos de Datos', invalid: 'Ingrese números válidos', minPoints: 'Al menos 2 puntos para simple, 3 para múltiple', singularMatrix: 'Matriz singular: variables pueden ser colineales' },
  fr: { title: 'Calculateur de Régression', subtitle: 'Analysez les relations entre les variables', method: 'Méthode', predictX: 'Prédire à X', predictX1: 'Prédire à X₁', predictX2: 'Prédire à X₂', calculate: 'Calculer', addPoint: 'Ajouter un Point', remove: 'Supprimer', result: 'Résultat', equation: 'Équation', rSquared: 'Score R²', predictedValue: 'Valeur Prédite', steps: 'Étapes', dataPoints: 'Points de Données', invalid: 'Entrez des nombres valides', minPoints: 'Au moins 2 points pour simple, 3 pour multiple', singularMatrix: 'Matrice singulière: variables colinéaires' },
  de: { title: 'Regressionsrechner', subtitle: 'Analysieren Sie Beziehungen zwischen Variablen', method: 'Methode', predictX: 'Vorhersage bei X', predictX1: 'Vorhersage bei X₁', predictX2: 'Vorhersage bei X₂', calculate: 'Berechnen', addPoint: 'Punkt Hinzufügen', remove: 'Entfernen', result: 'Ergebnis', equation: 'Gleichung', rSquared: 'R²-Wert', predictedValue: 'Vorhergesagter Wert', steps: 'Schritte', dataPoints: 'Datenpunkte', invalid: 'Bitte gültige Zahlen eingeben', minPoints: 'Mindestens 2 Punkte für einfach, 3 für mehrfach', singularMatrix: 'Singuläre Matrix: Variablen kollinear' },
  ja: { title: '回帰計算機', subtitle: '変数間の関係を分析', method: '手法', predictX: 'Xで予測', predictX1: 'X₁で予測', predictX2: 'X₂で予測', calculate: '計算', addPoint: 'ポイント追加', remove: '削除', result: '結果', equation: '方程式', rSquared: 'R²スコア', predictedValue: '予測値', steps: '手順', dataPoints: 'データポイント', invalid: '有効な数値を入力してください', minPoints: '単回帰は2点以上、重回帰は3点以上必要', singularMatrix: '特異行列: 変数が共線性の可能性' },
  ko: { title: '회귀 계산기', subtitle: '변수 간의 관계 분석', method: '방법', predictX: 'X에서 예측', predictX1: 'X₁에서 예측', predictX2: 'X₂에서 예측', calculate: '계산', addPoint: '포인트 추가', remove: '삭제', result: '결과', equation: '방정식', rSquared: 'R² 점수', predictedValue: '예측값', steps: '단계', dataPoints: '데이터 포인트', invalid: '유효한 숫자를 입력하세요', minPoints: '단순회귀 2개 이상, 다중회귀 3개 이상 필요', singularMatrix: '특이 행렬: 변수가 공선형일 수 있음' },
  ar: { title: 'حاسبة الانحدار', subtitle: 'حلل العلاقات بين المتغيرات', method: 'طريقة', predictX: 'توقع عند X', predictX1: 'توقع عند X₁', predictX2: 'توقع عند X₂', calculate: 'احسب', addPoint: 'إضافة نقطة', remove: 'إزالة', result: 'النتيجة', equation: 'المعادلة', rSquared: 'درجة R²', predictedValue: 'القيمة المتوقعة', steps: 'الخطوات', dataPoints: 'نقاط البيانات', invalid: 'أدخل أرقامًا صالحة', minPoints: 'نقطتين على الأقل للبسيط، 3 للمتعدد', singularMatrix: 'مصفوفة مفردة: المتغيرات قد تكون خطية مشتركة' },
  it: { title: 'Calcolatore di Regressione', subtitle: 'Analizza relazioni tra variabili', method: 'Metodo', predictX: 'Prevedi a X', predictX1: 'Prevedi a X₁', predictX2: 'Prevedi a X₂', calculate: 'Calcola', addPoint: 'Aggiungi Punto', remove: 'Rimuovi', result: 'Risultato', equation: 'Equazione', rSquared: 'Punteggio R²', predictedValue: 'Valore Previsto', steps: 'Passaggi', dataPoints: 'Punti Dati', invalid: 'Inserisci numeri validi', minPoints: 'Almeno 2 punti per semplice, 3 per multipla', singularMatrix: 'Matrice singolare: variabili collineari' },
  pt: { title: 'Calculadora de Regressão', subtitle: 'Analise relações entre variáveis', method: 'Método', predictX: 'Prever em X', predictX1: 'Prever em X₁', predictX2: 'Prever em X₂', calculate: 'Calcular', addPoint: 'Adicionar Ponto', remove: 'Remover', result: 'Resultado', equation: 'Equação', rSquared: 'Pontuação R²', predictedValue: 'Valor Previsto', steps: 'Etapas', dataPoints: 'Pontos de Dados', invalid: 'Insira números válidos', minPoints: 'Pelo menos 2 pontos para simples, 3 para múltipla', singularMatrix: 'Matriz singular: variáveis podem ser colineares' },
  ru: { title: 'Калькулятор Регрессии', subtitle: 'Анализируйте зависимости между переменными', method: 'Метод', predictX: 'Прогноз при X', predictX1: 'Прогноз при X₁', predictX2: 'Прогноз при X₂', calculate: 'Вычислить', addPoint: 'Добавить Точку', remove: 'Удалить', result: 'Результат', equation: 'Уравнение', rSquared: 'Оценка R²', predictedValue: 'Прогнозируемое Значение', steps: 'Шаги', dataPoints: 'Точки Данных', invalid: 'Введите корректные числа', minPoints: 'Минимум 2 точки для простой, 3 для множественной', singularMatrix: 'Сингулярная матрица: переменные коллинеарны' },
  hi: { title: 'प्रतिगमन कैलकुलेटर', subtitle: 'चरों के बीच संबंधों का विश्लेषण करें', method: 'विधि', predictX: 'X पर भविष्यवाणी', predictX1: 'X₁ पर भविष्यवाणी', predictX2: 'X₂ पर भविष्यवाणी', calculate: 'गणना करें', addPoint: 'बिंदु जोड़ें', remove: 'हटाएं', result: 'परिणाम', equation: 'समीकरण', rSquared: 'R² स्कोर', predictedValue: 'भविष्यवाणी मान', steps: 'चरण', dataPoints: 'डेटा बिंदु', invalid: 'कृपया मान्य संख्या दर्ज करें', minPoints: 'सरल के लिए 2, बहु के लिए 3 बिंदु आवश्यक', singularMatrix: 'विषम मैट्रिक्स: चर सहरेखीय हो सकते हैं' },
  bn: { title: 'নির্ভরণ ক্যালকুলেটর', subtitle: 'চলকের মধ্যে সম্পর্ক বিশ্লেষণ', method: 'পদ্ধতি', predictX: 'X এ পূর্বাভাস', predictX1: 'X₁ এ পূর্বাভাস', predictX2: 'X₂ এ পূর্বাভাস', calculate: 'গণনা', addPoint: 'পয়েন্ট যোগ', remove: 'সরান', result: 'ফলাফল', equation: 'সমীকরণ', rSquared: 'R² স্কোর', predictedValue: 'পূর্বাভাস মান', steps: 'ধাপ', dataPoints: 'ডেটা পয়েন্ট', invalid: 'বৈধ সংখ্যা দিন', minPoints: 'সরলে ২, বহুতে ৩ পয়েন্ট প্রয়োজন', singularMatrix: 'একক ম্যাট্রিক্স: চলক সমরেখীয় হতে পারে' },
  ms: { title: 'Kalkulator Regresi', subtitle: 'Analisis hubungan antara pembolehubah', method: 'Kaedah', predictX: 'Ramal pada X', predictX1: 'Ramal pada X₁', predictX2: 'Ramal pada X₂', calculate: 'Kira', addPoint: 'Tambah Titik', remove: 'Buang', result: 'Keputusan', equation: 'Persamaan', rSquared: 'Skor R²', predictedValue: 'Nilai Ramalan', steps: 'Langkah', dataPoints: 'Titik Data', invalid: 'Sila masukkan nombor yang sah', minPoints: 'Sekurang-kurangnya 2 titik untuk ringkas, 3 untuk berganda', singularMatrix: 'Matriks singular: pembolehubah mungkin kolinear' },
  pl: { title: 'Kalkulator Regresji', subtitle: 'Analizuj relacje między zmiennymi', method: 'Metoda', predictX: 'Przewiduj przy X', predictX1: 'Przewiduj przy X₁', predictX2: 'Przewiduj przy X₂', calculate: 'Oblicz', addPoint: 'Dodaj Punkt', remove: 'Usuń', result: 'Wynik', equation: 'Równanie', rSquared: 'Wynik R²', predictedValue: 'Wartość Przewidywana', steps: 'Kroki', dataPoints: 'Punkty Danych', invalid: 'Podaj prawidłowe liczby', minPoints: 'Minimum 2 punkty dla prostej, 3 dla wielokrotnej', singularMatrix: 'Macierz osobliwa: zmienne współliniowe' },
  id: { title: 'Kalkulator Regresi', subtitle: 'Analisis hubungan antar variabel', method: 'Metode', predictX: 'Prediksi pada X', predictX1: 'Prediksi pada X₁', predictX2: 'Prediksi pada X₂', calculate: 'Hitung', addPoint: 'Tambah Titik', remove: 'Hapus', result: 'Hasil', equation: 'Persamaan', rSquared: 'Skor R²', predictedValue: 'Nilai Prediksi', steps: 'Langkah', dataPoints: 'Titik Data', invalid: 'Masukkan angka yang valid', minPoints: 'Minimal 2 titik untuk sederhana, 3 untuk berganda', singularMatrix: 'Matriks singular: variabel mungkin kolinear' },
  bg: { title: 'Калкулатор за Регресия', subtitle: 'Анализирайте връзки между променливи', method: 'Метод', predictX: 'Прогноза при X', predictX1: 'Прогноза при X₁', predictX2: 'Прогноза при X₂', calculate: 'Изчисли', addPoint: 'Добави Точка', remove: 'Премахни', result: 'Резултат', equation: 'Уравнение', rSquared: 'R² Резултат', predictedValue: 'Прогнозирана Стойност', steps: 'Стъпки', dataPoints: 'Точки Данни', invalid: 'Въведете валидни числа', minPoints: 'Минимум 2 точки за проста, 3 за множествена', singularMatrix: 'Сингулярна матрица: променливите може да са колинеарни' },
  tr: { title: 'Regresyon Hesaplayıcısı', subtitle: 'Değişkenler arasındaki ilişkileri analiz edin', method: 'Yöntem', predictX: 'X\'te Tahmin', predictX1: 'X₁\'de Tahmin', predictX2: 'X₂\'de Tahmin', calculate: 'Hesapla', addPoint: 'Nokta Ekle', remove: 'Kaldır', result: 'Sonuç', equation: 'Denklem', rSquared: 'R² Skoru', predictedValue: 'Tahmin Edilen Değer', steps: 'Adımlar', dataPoints: 'Veri Noktaları', invalid: 'Geçerli sayılar girin', minPoints: 'Basit için en az 2, çoklu için 3 nokta gerekli', singularMatrix: 'Tekil matris: değişkenler eşdoğrusal olabilir' },
  sv: { title: 'Regressionskalkylator', subtitle: 'Analysera samband mellan variabler', method: 'Metod', predictX: 'Förutsäg vid X', predictX1: 'Förutsäg vid X₁', predictX2: 'Förutsäg vid X₂', calculate: 'Beräkna', addPoint: 'Lägg Till Punkt', remove: 'Ta Bort', result: 'Resultat', equation: 'Ekvation', rSquared: 'R²-poäng', predictedValue: 'Förutsagt Värde', steps: 'Steg', dataPoints: 'Datapunkter', invalid: 'Ange giltiga siffror', minPoints: 'Minst 2 punkter för enkel, 3 för multipel', singularMatrix: 'Singulär matris: variabler kan vara kollinjära' },
};

function L(key: string, locale: string): string {
  const l = locale || 'en';
  return ui[l]?.[key] ?? ui.en[key] ?? key;
}

export default function RegressionCalculator({ locale = 'en' }: Props) {
  const [method, setMethod] = useState<RegMethod>('simple');
  const [simpleRows, setSimpleRows] = useState<{ x: string; y: string }[]>([
    { x: '1', y: '2.1' }, { x: '2', y: '3.9' }, { x: '3', y: '6.2' }, { x: '4', y: '7.8' }, { x: '5', y: '10.1' },
  ]);
  const [multiRows, setMultiRows] = useState<{ x1: string; x2: string; y: string }[]>([
    { x1: '1', x2: '2', y: '5' }, { x1: '2', x2: '3', y: '8' }, { x1: '3', x2: '1', y: '7' }, { x1: '4', x2: '4', y: '12' }, { x1: '5', x2: '2', y: '10' },
  ]);
  const [predictX, setPredictX] = useState<string>('6');
  const [predictX1, setPredictX1] = useState<string>('6');
  const [predictX2, setPredictX2] = useState<string>('3');
  const [result, setResult] = useState<RegressionResult | null>(null);
  const [error, setError] = useState<string>('');

  const calculateSimple = useCallback(() => {
    const pts = simpleRows
      .map(r => ({ x: Number(r.x), y: Number(r.y) }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y));
    const tgtNum = Number(predictX);
    if (isNaN(tgtNum) || !isFinite(tgtNum)) { setError(L('invalid', locale)); setResult(null); return; }
    try {
      const res = simpleRegression(pts, tgtNum);
      setResult(res); setError('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      if (msg.includes('Singular')) setError(L('singularMatrix', locale)); else setError(msg);
      setResult(null);
    }
  }, [simpleRows, predictX, locale]);

  const calculateMultiple = useCallback(() => {
    const pts = multiRows
      .map(r => ({ x1: Number(r.x1), x2: Number(r.x2), y: Number(r.y) }))
      .filter(p => !isNaN(p.x1) && !isNaN(p.x2) && !isNaN(p.y));
    const tgt1 = Number(predictX1), tgt2 = Number(predictX2);
    if (isNaN(tgt1) || isNaN(tgt2) || !isFinite(tgt1) || !isFinite(tgt2)) { setError(L('invalid', locale)); setResult(null); return; }
    try {
      const res = multipleRegression(pts, tgt1, tgt2);
      setResult(res); setError('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      if (msg.includes('Singular')) setError(L('singularMatrix', locale)); else setError(msg);
      setResult(null);
    }
  }, [multiRows, predictX1, predictX2, locale]);

  const debouncedSimple = useCallback(debounce(calculateSimple, 300), [calculateSimple]);
  const debouncedMultiple = useCallback(debounce(calculateMultiple, 300), [calculateMultiple]);

  useEffect(() => {
    if (method === 'simple') debouncedSimple();
    else debouncedMultiple();
  }, [method === 'simple' ? simpleRows : multiRows, method === 'simple' ? predictX : predictX1, predictX2, method, debouncedSimple, debouncedMultiple]);

  const addSimpleRow = () => setSimpleRows([...simpleRows, { x: '', y: '' }]);
  const removeSimpleRow = (i: number) => { if (simpleRows.length <= 2) return; setSimpleRows(simpleRows.filter((_, idx) => idx !== i)); };
  const updateSimpleRow = (i: number, field: 'x' | 'y', val: string) => { const n = [...simpleRows]; n[i] = { ...n[i], [field]: sanitizeInput(val) }; setSimpleRows(n); };

  const addMultiRow = () => setMultiRows([...multiRows, { x1: '', x2: '', y: '' }]);
  const removeMultiRow = (i: number) => { if (multiRows.length <= 2) return; setMultiRows(multiRows.filter((_, idx) => idx !== i)); };
  const updateMultiRow = (i: number, field: 'x1' | 'x2' | 'y', val: string) => { const n = [...multiRows]; n[i] = { ...n[i], [field]: sanitizeInput(val) }; setMultiRows(n); };

  return (
    <div className="calculator-card p-6 md:p-8 max-w-4xl mx-auto dark:bg-neutral-900 dark:border-neutral-700" role="application" aria-label={L('title', locale)}>
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">{L('title', locale)}</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed">{L('subtitle', locale)}</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['simple', 'multiple'] as RegMethod[]).map((m) => (
          <button key={m} onClick={() => { setMethod(m); setResult(null); setError(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none ${method === m ? 'bg-primary text-white shadow-md hover:scale-105' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}>
            {methodLabels[m][locale] ?? methodLabels[m].en}
          </button>
        ))}
      </div>

      {method === 'simple' ? (
        <>
          <div className="mb-6">
            <label htmlFor="reg-predict-x" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{L('predictX', locale)}</label>
            <input id="reg-predict-x" type="number" step="any" value={predictX} onChange={(e) => setPredictX(e.target.value)} className="input-field" />
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{L('dataPoints', locale)}</h2>
              <button onClick={addSimpleRow} className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium hover:scale-105 transition-all duration-200">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                {L('addPoint', locale)}
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 px-1">
                <span>X</span><span>Y</span><span className="w-8"></span>
              </div>
              {simpleRows.map((row, i) => (
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={i}>
                  <input type="number" step="any" value={row.x} onChange={(e) => updateSimpleRow(i, 'x', e.target.value)} className="input-field py-2" aria-label={`Point ${i + 1} X`} />
                  <input type="number" step="any" value={row.y} onChange={(e) => updateSimpleRow(i, 'y', e.target.value)} className="input-field py-2" aria-label={`Point ${i + 1} Y`} />
                  <button onClick={() => removeSimpleRow(i)} disabled={simpleRows.length <= 2} className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button onClick={calculateSimple} className="w-full btn-primary justify-center shadow-md hover:shadow-lg">{L('calculate', locale)}</button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 calculator-inputs">
            <div>
              <label htmlFor="reg-predict-x1" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{L('predictX1', locale)}</label>
              <input id="reg-predict-x1" type="number" step="any" value={predictX1} onChange={(e) => setPredictX1(e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="reg-predict-x2" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{L('predictX2', locale)}</label>
              <input id="reg-predict-x2" type="number" step="any" value={predictX2} onChange={(e) => setPredictX2(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{L('dataPoints', locale)}</h2>
              <button onClick={addMultiRow} className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium hover:scale-105 transition-all duration-200">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                {L('addPoint', locale)}
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 px-1">
                <span>X₁</span><span>X₂</span><span>Y</span><span className="w-8"></span>
              </div>
              {multiRows.map((row, i) => (
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2" key={i}>
                  <input type="number" step="any" value={row.x1} onChange={(e) => updateMultiRow(i, 'x1', e.target.value)} className="input-field py-2" aria-label={`Point ${i + 1} X1`} />
                  <input type="number" step="any" value={row.x2} onChange={(e) => updateMultiRow(i, 'x2', e.target.value)} className="input-field py-2" aria-label={`Point ${i + 1} X2`} />
                  <input type="number" step="any" value={row.y} onChange={(e) => updateMultiRow(i, 'y', e.target.value)} className="input-field py-2" aria-label={`Point ${i + 1} Y`} />
                  <button onClick={() => removeMultiRow(i)} disabled={multiRows.length <= 2} className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button onClick={calculateMultiple} className="w-full btn-primary justify-center shadow-md hover:shadow-lg">{L('calculate', locale)}</button>
        </>
      )}

      {error && <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-300" role="alert">{error}</div>}

      {result && (
        <div className="mt-6 p-6 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-md">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{L('result', locale)}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{L('predictedValue', locale)}</p>
              <p className="text-xl font-bold text-primary">{result.predictedValue.toFixed(6)}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{L('rSquared', locale)}</p>
              <p className="text-xl font-bold text-secondary">{(result.rSquared * 100).toFixed(2)}%</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 sm:col-span-2">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{L('equation', locale)}</p>
              <p className="text-sm font-mono text-neutral-800 dark:text-neutral-200">{result.equation}</p>
            </div>
          </div>
          <div className="mt-4 bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{L('steps', locale)}</p>
            <ol className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
              {result.steps.map((step, i) => (
                <li key={i} className="flex gap-2"><span className="text-neutral-400 dark:text-neutral-500 font-mono">{i + 1}.</span>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
