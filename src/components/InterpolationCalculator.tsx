import { useState, useCallback, useEffect } from 'react';
import type { Point, InterpolationResult } from '../utils/interpolation';
import { interpolationMethods } from '../utils/interpolation';
import { sanitizeInput, debounce } from '../utils/validation';

type InterpMethod = 'linear' | 'lagrange' | 'spline';

interface Props {
  locale?: string;
}

const methodLabels: Record<InterpMethod, Record<string, string>> = {
  linear: { en: 'Linear Interpolation', hi: 'रैखिक अंतरवेशन', es: 'Interpolación Lineal', ru: 'Линейная Интерполяция', fr: 'Interpolation Linéaire', de: 'Lineare Interpolation', it: 'Interpolazione Lineare', pt: 'Interpolação Linear', bn: 'রৈখিক অন্তর্বেশন', ja: '線形補間', ko: '선형 보간', ms: 'Interpolasi Linear', pl: 'Interpolacja Liniowa', id: 'Interpolasi Linear', ar: 'الاستكمال الخطي', bg: 'Линейна Интерполация', tr: 'Doğrusal İnterpolasyon', sv: 'Linjär Interpolation' },
  lagrange: { en: 'Lagrange Polynomial', hi: 'लग्रेंज बहुपद', es: 'Polinomio de Lagrange', ru: 'Полином Лагранжа', fr: 'Polynôme de Lagrange', de: 'Lagrange-Polynom', it: 'Polinomio di Lagrange', pt: 'Polinômio de Lagrange', bn: 'লাগ্রাঞ্জ বহুপদীয়', ja: 'ラグランジュ多項式', ko: '라그랑주 다항식', ms: 'Polinomial Lagrange', pl: 'Wielomian Lagrange\'a', id: 'Polinomial Lagrange', ar: 'كثير حدود لاغرانج', bg: 'Многочлен на Лагранж', tr: 'Lagrange Polinomu', sv: 'Lagrange-polynom' },
  spline: { en: 'Cubic Spline', hi: 'घन स्पलाइन', es: 'Spline Cúbico', ru: 'Кубический Сплайн', fr: 'Spline Cubique', de: 'Kubischer Spline', it: 'Spline Cubica', pt: 'Spline Cúbico', bn: 'কিউবিক স্প্লাইন', ja: '3次スプライン', ko: '3차 스플라인', ms: 'Spline Kubik', pl: 'Funkcja Sklejana', id: 'Spline Kubik', ar: 'شريحة تكعيبية', bg: 'Кубичен Сплайн', tr: 'Kübik Spline', sv: 'Kubisk Spline' },
};

const ui: Record<string, Record<string, string>> = {
  en: { title: 'Interpolation Calculator', subtitle: 'Estimate values between known data points', method: 'Method', targetX: 'Target X', calculate: 'Interpolate', addPoint: 'Add Point', remove: 'Remove', result: 'Result', steps: 'Steps', interpolatedValue: 'Interpolated Value', dataPoints: 'Data Points', invalid: 'Please enter valid numbers', minPoints: 'At least 2 data points required', maxPoints: 'Maximum 5 points for Lagrange', duplicateX: 'Duplicate X values are not allowed', rangeError: 'Target X outside spline range' },
  es: { title: 'Calculadora de Interpolación', subtitle: 'Estima valores entre puntos conocidos', method: 'Método', targetX: 'Valor X Objetivo', calculate: 'Interpolar', addPoint: 'Agregar Punto', remove: 'Eliminar', result: 'Resultado', steps: 'Pasos', interpolatedValue: 'Valor Interpolado', dataPoints: 'Puntos de Datos', invalid: 'Ingrese números válidos', minPoints: 'Se necesitan al menos 2 puntos', maxPoints: 'Máximo 5 puntos para Lagrange', duplicateX: 'Valores X duplicados no permitidos', rangeError: 'X objetivo fuera del rango del spline' },
  fr: { title: "Calculateur d'Interpolation", subtitle: 'Estimez les valeurs entre les points connus', method: 'Méthode', targetX: 'Valeur X Cible', calculate: 'Interpoler', addPoint: 'Ajouter un Point', remove: 'Supprimer', result: 'Résultat', steps: 'Étapes', interpolatedValue: 'Valeur Interpolée', dataPoints: 'Points de Données', invalid: 'Entrez des nombres valides', minPoints: 'Au moins 2 points nécessaires', maxPoints: 'Maximum 5 points pour Lagrange', duplicateX: 'Valeurs X en double non autorisées', rangeError: 'X cible hors plage du spline' },
  de: { title: 'Interpolationsrechner', subtitle: 'Schätzen Sie Werte zwischen bekannten Datenpunkten', method: 'Methode', targetX: 'Ziel-X-Wert', calculate: 'Interpolieren', addPoint: 'Punkt Hinzufügen', remove: 'Entfernen', result: 'Ergebnis', steps: 'Schritte', interpolatedValue: 'Interpolierter Wert', dataPoints: 'Datenpunkte', invalid: 'Bitte gültige Zahlen eingeben', minPoints: 'Mindestens 2 Punkte erforderlich', maxPoints: 'Maximal 5 Punkte für Lagrange', duplicateX: 'Doppelte X-Werte nicht erlaubt', rangeError: 'Ziel-X außerhalb des Spline-Bereichs' },
  ja: { title: '補間計算機', subtitle: '既知のデータポイント間の値を推定', method: '手法', targetX: '目標X値', calculate: '補間', addPoint: 'ポイント追加', remove: '削除', result: '結果', steps: '手順', interpolatedValue: '補間値', dataPoints: 'データポイント', invalid: '有効な数値を入力してください', minPoints: '2つ以上のポイントが必要', maxPoints: 'ラグランジュは最大5点', duplicateX: '重複するX値は許可されません', rangeError: '目標Xがスプライン範囲外' },
  ko: { title: '보간 계산기', subtitle: '알려진 데이터 포인트 사이의 값 추정', method: '방법', targetX: '목표 X 값', calculate: '보간', addPoint: '포인트 추가', remove: '삭제', result: '결과', steps: '단계', interpolatedValue: '보간 값', dataPoints: '데이터 포인트', invalid: '유효한 숫자를 입력하세요', minPoints: '최소 2개 포인트 필요', maxPoints: '라그랑주는 최대 5개', duplicateX: '중복 X 값은 허용되지 않습니다', rangeError: '목표 X가 스플라인 범위 밖' },
  ar: { title: 'حاسبة الاستكمال الداخلي', subtitle: 'تقدير القيم بين نقاط البيانات المعروفة', method: 'طريقة', targetX: 'القيمة المستهدفة X', calculate: 'استكمال', addPoint: 'إضافة نقطة', remove: 'إزالة', result: 'النتيجة', steps: 'الخطوات', interpolatedValue: 'القيمة المستكملة', dataPoints: 'نقاط البيانات', invalid: 'أدخل أرقامًا صالحة', minPoints: 'مطلوب نقطتي بيانات على الأقل', maxPoints: 'الحد الأقصى 5 نقاط للاغرانج', duplicateX: 'قيم X المكررة غير مسموح بها', rangeError: 'X المستهدف خارج نطاق الشريحة' },
  it: { title: 'Calcolatore di Interpolazione', subtitle: 'Stima valori tra punti noti', method: 'Metodo', targetX: 'Valore X Target', calculate: 'Interpola', addPoint: 'Aggiungi Punto', remove: 'Rimuovi', result: 'Risultato', steps: 'Passaggi', interpolatedValue: 'Valore Interpolato', dataPoints: 'Punti Dati', invalid: 'Inserisci numeri validi', minPoints: 'Sono necessari almeno 2 punti', maxPoints: 'Massimo 5 punti per Lagrange', duplicateX: 'Valori X duplicati non ammessi', rangeError: 'X target fuori range spline' },
  pt: { title: 'Calculadora de Interpolação', subtitle: 'Estime valores entre pontos conhecidos', method: 'Método', targetX: 'Valor X Alvo', calculate: 'Interpolar', addPoint: 'Adicionar Ponto', remove: 'Remover', result: 'Resultado', steps: 'Etapas', interpolatedValue: 'Valor Interpolado', dataPoints: 'Pontos de Dados', invalid: 'Insira números válidos', minPoints: 'Pelo menos 2 pontos necessários', maxPoints: 'Máximo 5 pontos para Lagrange', duplicateX: 'Valores X duplicados não permitidos', rangeError: 'X alvo fora do intervalo do spline' },
  ru: { title: 'Калькулятор Интерполяции', subtitle: 'Оценка значений между известными точками', method: 'Метод', targetX: 'Целевое X', calculate: 'Интерполировать', addPoint: 'Добавить Точку', remove: 'Удалить', result: 'Результат', steps: 'Шаги', interpolatedValue: 'Интерполированное Значение', dataPoints: 'Точки Данных', invalid: 'Введите корректные числа', minPoints: 'Необходимо минимум 2 точки', maxPoints: 'Максимум 5 точек для Лагранжа', duplicateX: 'Дубликаты X не допускаются', rangeError: 'X вне диапазона сплайна' },
  hi: { title: 'अंतरवेशन कैलकुलेटर', subtitle: 'ज्ञात डेटा बिंदुओं के बीच मानों का अनुमान', method: 'विधि', targetX: 'लक्ष्य X', calculate: 'अंतरवेशन', addPoint: 'बिंदु जोड़ें', remove: 'हटाएं', result: 'परिणाम', steps: 'चरण', interpolatedValue: 'अंतरवेशित मान', dataPoints: 'डेटा बिंदु', invalid: 'कृपया मान्य संख्या दर्ज करें', minPoints: 'कम से कम 2 बिंदु आवश्यक', maxPoints: 'लग्रेंज के लिए अधिकतम 5 बिंदु', duplicateX: 'डुप्लिकेट X मान अनुमत नहीं', rangeError: 'लक्ष्य X स्प्लाइन सीमा से बाहर' },
  bn: { title: 'অন্তর্বেশন ক্যালকুলেটর', subtitle: 'পরিচিত ডেটা পয়েন্টের মধ্যে মান অনুমান', method: 'পদ্ধতি', targetX: 'লক্ষ্য X', calculate: 'অন্তর্বেশন', addPoint: 'পয়েন্ট যোগ', remove: 'সরান', result: 'ফলাফল', steps: 'ধাপ', interpolatedValue: 'অন্তর্বেশিত মান', dataPoints: 'ডেটা পয়েন্ট', invalid: 'বৈধ সংখ্যা দিন', minPoints: 'কমপক্ষে ২টি পয়েন্ট প্রয়োজন', maxPoints: 'লাগ্রাঞ্জের জন্য সর্বোচ্চ ৫', duplicateX: 'ডুপ্লিকেট X অনুমোদিত নয়', rangeError: 'লক্ষ্য X স্প্লাইন সীমার বাইরে' },
  ms: { title: 'Kalkulator Interpolasi', subtitle: 'Anggar nilai antara titik data yang diketahui', method: 'Kaedah', targetX: 'Nilai X Sasaran', calculate: 'Interpolasi', addPoint: 'Tambah Titik', remove: 'Buang', result: 'Keputusan', steps: 'Langkah', interpolatedValue: 'Nilai Interpolasi', dataPoints: 'Titik Data', invalid: 'Sila masukkan nombor yang sah', minPoints: 'Sekurang-kurangnya 2 titik diperlukan', maxPoints: 'Maksimum 5 titik untuk Lagrange', duplicateX: 'Nilai X pendua tidak dibenarkan', rangeError: 'X sasaran di luar julat spline' },
  pl: { title: 'Kalkulator Interpolacji', subtitle: 'Szacuj wartości między znanymi punktami', method: 'Metoda', targetX: 'Docelowe X', calculate: 'Interpoluj', addPoint: 'Dodaj Punkt', remove: 'Usuń', result: 'Wynik', steps: 'Kroki', interpolatedValue: 'Wartość Interpolowana', dataPoints: 'Punkty Danych', invalid: 'Podaj prawidłowe liczby', minPoints: 'Wymagane co najmniej 2 punkty', maxPoints: 'Maksimum 5 punktów dla Lagrange\'a', duplicateX: 'Zduplikowane wartości X niedozwolone', rangeError: 'X docelowe poza zakresem splajnu' },
  id: { title: 'Kalkulator Interpolasi', subtitle: 'Estimasikan nilai antara titik data yang diketahui', method: 'Metode', targetX: 'Nilai X Target', calculate: 'Interpolasi', addPoint: 'Tambah Titik', remove: 'Hapus', result: 'Hasil', steps: 'Langkah', interpolatedValue: 'Nilai Interpolasi', dataPoints: 'Titik Data', invalid: 'Masukkan angka yang valid', minPoints: 'Minimal 2 titik diperlukan', maxPoints: 'Maksimum 5 titik untuk Lagrange', duplicateX: 'Nilai X ganda tidak diizinkan', rangeError: 'X target di luar rentang spline' },
  bg: { title: 'Калкулатор за Интерполация', subtitle: 'Оценете стойности между известни точки', method: 'Метод', targetX: 'Целева X Стойност', calculate: 'Интерполирай', addPoint: 'Добави Точка', remove: 'Премахни', result: 'Резултат', steps: 'Стъпки', interpolatedValue: 'Интерполирана Стойност', dataPoints: 'Точки Данни', invalid: 'Въведете валидни числа', minPoints: 'Необходими са поне 2 точки', maxPoints: 'Максимум 5 точки за Лагранж', duplicateX: 'Дублиращи X стойности не са позволени', rangeError: 'Целева X извън обхвата на сплайна' },
  tr: { title: 'İnterpolasyon Hesaplayıcısı', subtitle: 'Bilinen veri noktaları arasındaki değerleri tahmin edin', method: 'Yöntem', targetX: 'Hedef X Değeri', calculate: 'İnterpole Et', addPoint: 'Nokta Ekle', remove: 'Kaldır', result: 'Sonuç', steps: 'Adımlar', interpolatedValue: 'İnterpole Edilen Değer', dataPoints: 'Veri Noktaları', invalid: 'Geçerli sayılar girin', minPoints: 'En az 2 veri noktası gerekli', maxPoints: 'Lagrange için maksimum 5 nokta', duplicateX: 'Yinelenen X değerlerine izin verilmez', rangeError: 'Hedef X spline aralığı dışında' },
  sv: { title: 'Interpolationskalkylator', subtitle: 'Beräkna värden mellan kända datapunkter', method: 'Metod', targetX: 'Målvärde X', calculate: 'Interpolera', addPoint: 'Lägg Till Punkt', remove: 'Ta Bort', result: 'Resultat', steps: 'Steg', interpolatedValue: 'Interpolerat Värde', dataPoints: 'Datapunkter', invalid: 'Ange giltiga siffror', minPoints: 'Minst 2 datapunkter krävs', maxPoints: 'Max 5 punkter för Lagrange', duplicateX: 'Dubbletta X-värden ej tillåtna', rangeError: 'Målvärde X utanför spline-intervall' },
};

function L(key: string, locale: string): string {
  const l = locale || 'en';
  return ui[l]?.[key] ?? ui.en[key] ?? key;
}

export default function InterpolationCalculator({ locale = 'en' }: Props) {
  const [inputRows, setInputRows] = useState<{ x: string; y: string }[]>([
    { x: '1', y: '2' },
    { x: '3', y: '6' },
    { x: '5', y: '10' },
  ]);
  const [method, setMethod] = useState<InterpMethod>('linear');
  const [targetX, setTargetX] = useState<string>('4');
  const [result, setResult] = useState<InterpolationResult | null>(null);
  const [error, setError] = useState<string>('');

  const calculate = useCallback(
    (pts: Point[], meth: InterpMethod, tgt: string) => {
      const tgtNum = Number(tgt);
      if (isNaN(tgtNum) || !isFinite(tgtNum)) {
        setError(L('invalid', locale));
        setResult(null);
        return;
      }
      if (pts.length < 2) {
        setError(L('minPoints', locale));
        setResult(null);
        return;
      }
      if (meth === 'lagrange' && pts.length > 5) {
        setError(L('maxPoints', locale));
        setResult(null);
        return;
      }
      try {
        const fn = interpolationMethods[meth];
        const res = fn(pts, tgtNum);
        setResult(res);
        setError('');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Calculation error';
        if (msg.includes('Duplicate')) setError(L('duplicateX', locale));
        else if (msg.includes('outside') || msg.includes('range')) setError(L('rangeError', locale));
        else setError(msg);
        setResult(null);
      }
    },
    [locale]
  );

  const debouncedCalc = useCallback(
    debounce((pts: Point[], meth: InterpMethod, tgt: string) => calculate(pts, meth, tgt), 300),
    [calculate]
  );

  useEffect(() => {
    const validPoints: Point[] = [];
    let hasInvalid = false;
    inputRows.forEach((row) => {
      const x = Number(row.x);
      const y = Number(row.y);
      if (isNaN(x) || isNaN(y) || row.x === '' || row.y === '') hasInvalid = true;
      else validPoints.push({ x, y });
    });
    if (!hasInvalid && validPoints.length >= 2) {
      debouncedCalc(validPoints, method, targetX);
    }
  }, [inputRows, method, targetX, debouncedCalc]);

  const addRow = () => setInputRows([...inputRows, { x: '', y: '' }]);
  const removeRow = (i: number) => {
    if (inputRows.length <= 2) return;
    setInputRows(inputRows.filter((_, idx) => idx !== i));
  };
  const updateRow = (i: number, field: 'x' | 'y', value: string) => {
    const sanitized = sanitizeInput(value);
    const newRows = [...inputRows];
    newRows[i] = { ...newRows[i], [field]: sanitized };
    setInputRows(newRows);
  };

  const handleCalculate = () => {
    const pts: Point[] = [];
    inputRows.forEach((row) => {
      const x = Number(row.x);
      const y = Number(row.y);
      if (!isNaN(x) && !isNaN(y) && row.x !== '' && row.y !== '') pts.push({ x, y });
    });
    calculate(pts, method, targetX);
  };

  return (
    <div className="calculator-card p-6 md:p-8 max-w-4xl mx-auto dark:bg-neutral-900 dark:border-neutral-700" role="application" aria-label={L('title', locale)}>
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">{L('title', locale)}</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed">{L('subtitle', locale)}</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['linear', 'lagrange', 'spline'] as InterpMethod[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              method === m
                ? 'bg-primary text-white shadow-md hover:scale-105'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {methodLabels[m][locale] ?? methodLabels[m].en}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 calculator-inputs">
        <div>
          <label htmlFor="interp-target-x" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{L('targetX', locale)}</label>
          <input id="interp-target-x" type="number" step="any" value={targetX} onChange={(e) => setTargetX(e.target.value)} className="input-field" aria-label={L('targetX', locale)} />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{L('dataPoints', locale)}</h2>
          <button onClick={addRow} className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium hover:scale-105 transition-all duration-200" aria-label={L('addPoint', locale)}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            {L('addPoint', locale)}
          </button>
        </div>
        <div className="space-y-2" role="table" aria-label={L('dataPoints', locale)}>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 px-1" role="row">
            <span role="columnheader">X</span><span role="columnheader">Y</span><span className="w-8" role="columnheader"></span>
          </div>
          {inputRows.map((row, i) => (
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2" role="row" key={i}>
              <input type="number" step="any" value={row.x} onChange={(e) => updateRow(i, 'x', e.target.value)} aria-label={`Point ${i + 1} X`} className="input-field py-2" role="cell" />
              <input type="number" step="any" value={row.y} onChange={(e) => updateRow(i, 'y', e.target.value)} aria-label={`Point ${i + 1} Y`} className="input-field py-2" role="cell" />
              <button onClick={() => removeRow(i)} disabled={inputRows.length <= 2} className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label={`${L('remove', locale)} point ${i + 1}`}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleCalculate} className="w-full btn-primary justify-center shadow-md hover:shadow-lg" aria-label={L('calculate', locale)}>
        {L('calculate', locale)}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-300" role="alert">{error}</div>
      )}

      {result && (
        <div className="mt-6 p-6 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-md">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{L('result', locale)}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{L('interpolatedValue', locale)}</p>
              <p className="text-xl font-bold text-primary">{result.value.toFixed(6)}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{L('method', locale)}</p>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{result.method}</p>
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
