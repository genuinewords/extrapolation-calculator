import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { jsPDF } from 'jspdf';
import type { Point, CalculationResult } from '../utils/extrapolation';
import { methods } from '../utils/extrapolation';
import { validatePoint, sanitizeInput, exportToCSV, downloadCSV, downloadPNG, debounce } from '../utils/validation';

const ExtrapolationChart = lazy(() => import('./ExtrapolationChart'));

type MethodKey = 'linear' | 'exponential' | 'logarithmic' | 'polynomial' | 'quadratic';

interface Props {
  locale?: string;
}

const methodLabels: Record<MethodKey, Record<string, string>> = {
  linear: { en: 'Linear', hi: 'रैखिक', es: 'Lineal', ru: 'Линейный', fr: 'Linéaire', de: 'Linear', it: 'Lineare', pt: 'Linear', bn: 'রৈখিক', ja: '線形', ko: '선형', ms: 'Linear', pl: 'Liniowa', id: 'Linear', ar: 'خطي', bg: 'Линеен', tr: 'Doğrusal', sv: 'Linjär' },
  exponential: { en: 'Exponential', hi: 'घातीय', es: 'Exponencial', ru: 'Экспоненциальный', fr: 'Exponentielle', de: 'Exponentiell', it: 'Esponenziale', pt: 'Exponencial', bn: 'সূক্ষ্মগণিতিক', ja: '指数', ko: '지수', ms: 'Eksponen', pl: 'Wykładnicza', id: 'Eksponensial', ar: 'أسي', bg: 'Експоненциален', tr: 'Üstel', sv: 'Exponentiell' },
  logarithmic: { en: 'Logarithmic', hi: 'लघुगणकीय', es: 'Logarítmico', ru: 'Логарифмический', fr: 'Logarithmique', de: 'Logarithmisch', it: 'Logaritmico', pt: 'Logarítmico', bn: 'লগারিদমিক', ja: '対数', ko: '로그', ms: 'Logaritma', pl: 'Logarytmiczna', id: 'Logaritmik', ar: 'لوغاريتمي', bg: 'Логаритмичен', tr: 'Logaritmik', sv: 'Logaritmisk' },
  polynomial: { en: 'Polynomial', hi: 'बहुपदीय', es: 'Polinomial', ru: 'Полиномиальный', fr: 'Polynomiale', de: 'Polynomiell', it: 'Polinomiale', pt: 'Polinomial', bn: 'বহুপদীয়', ja: '多項式', ko: '다항식', ms: 'Polinomial', pl: 'Wielomianowa', id: 'Polinomial', ar: 'كثير الحدود', bg: 'Полиномиален', tr: 'Polinomiyal', sv: 'Polynomisk' },
  quadratic: { en: 'Quadratic', hi: 'द्विघात', es: 'Cuadrático', ru: 'Квадратичный', fr: 'Quadratique', de: 'Quadratisch', it: 'Quadratico', pt: 'Quadrático', bn: 'দ্বিঘাত', ja: '二次', ko: '이차', ms: 'Kuadratik', pl: 'Kwadratowa', id: 'Kuadratik', ar: 'تربيعي', bg: 'Квадратичен', tr: 'Karesel', sv: 'Kvadratisk' },
};

const uiLabels: Record<string, Record<string, string>> = {
  en: { title: 'Extrapolation Calculator', subtitle: 'Predict future values from your data', method: 'Method', targetX: 'Target X', calculate: 'Calculate', addPoint: 'Add Data Point', remove: 'Remove', result: 'Result', equation: 'Equation', rSquared: 'R² Score', confidence: 'Confidence', extrapolatedValue: 'Extrapolated Value', export: 'Export', csv: 'Export CSV', png: 'Export PNG', pdf: 'Export PDF', invalid: 'Please enter valid numbers', minPoints: 'At least 2 data points required', dataPoints: 'Data Points', chartLoading: 'Loading chart...', noscript: 'JavaScript is required for the interactive calculator. Please enable JavaScript to use this tool.' },
  hi: { title: 'बाह्यगणना कैलकुलेटर', subtitle: 'अपने डेटा से भविष्य के मनों की भविष्यवणी करें', method: 'विधि', targetX: 'लक्ष्य X', calculate: 'गणना करें', addPoint: 'डेटा बिंदु जोड़ें', remove: 'हटाएं', result: 'परिणाम', equation: 'समीकरण', rSquared: 'R² स्कोर', confidence: 'विश्वास', extrapolatedValue: 'बाह्यगणित मान', export: 'निर्यात', csv: 'CSV निर्यात', png: 'PNG निर्यात', pdf: 'PDF निर्यात', invalid: 'कृपया मान्य संख्या दर्ज करें', minPoints: 'कम से कम 2 डेटा बिंदु आवश्यक', dataPoints: 'डेटा बिंदु', chartLoading: 'चार्ट लोड हो रहा है...', noscript: 'इंटरैक्टिव कैलकुलेटर के लिए JavaScript आवश्यक है।' },
  es: { title: 'Calculadora de Extrapolación', subtitle: 'Predice valores futuros a partir de tus datos', method: 'Método', targetX: 'Valor X Objetivo', calculate: 'Calcular', addPoint: 'Agregar Punto', remove: 'Eliminar', result: 'Resultado', equation: 'Ecuación', rSquared: 'Puntuación R²', confidence: 'Confianza', extrapolatedValue: 'Valor Extrapolado', export: 'Exportar', csv: 'Exportar CSV', png: 'Exportar PNG', pdf: 'Exportar PDF', invalid: 'Ingrese números válidos', minPoints: 'Se necesitan al menos 2 puntos', dataPoints: 'Puntos de Datos', chartLoading: 'Cargando gráfico...', noscript: 'Se requiere JavaScript para la calculadora interactiva.' },
  ru: { title: 'Калькулятор Экстраполяции', subtitle: 'Прогнозируйте будущие значения', method: 'Метод', targetX: 'Целевое X', calculate: 'Вычислить', addPoint: 'Добавить Точку', remove: 'Удалить', result: 'Результат', equation: 'Уравнение', rSquared: 'Оценка R²', confidence: 'Доверие', extrapolatedValue: 'Экстраполированное Значение', export: 'Экспорт', csv: 'Экспорт CSV', png: 'Экспорт PNG', pdf: 'Экспорт PDF', invalid: 'Введите корректные числа', minPoints: 'Необходимо минимум 2 точки', dataPoints: 'Точки Данных', chartLoading: 'Загрузка графика...', noscript: 'Для интерактивного калькулятора требуется JavaScript.' },
  fr: { title: "Calculateur d'Extrapolation", subtitle: 'Prédisez les valeurs futures', method: 'Méthode', targetX: 'Valeur X Cible', calculate: 'Calculer', addPoint: 'Ajouter un Point', remove: 'Supprimer', result: 'Résultat', equation: 'Équation', rSquared: 'Score R²', confidence: 'Confiance', extrapolatedValue: 'Valeur Extrapolée', export: 'Exporter', csv: 'Exporter CSV', png: 'Exporter PNG', pdf: 'Exporter PDF', invalid: 'Entrez des nombres valides', minPoints: 'Au moins 2 points sont nécessaires', dataPoints: 'Points de Données', chartLoading: 'Chargement du graphique...', noscript: 'JavaScript est requis pour le calculateur interactif.' },
  de: { title: 'Extrapolationsrechner', subtitle: 'Zukünftige Werte vorhersagen', method: 'Methode', targetX: 'Ziel-X-Wert', calculate: 'Berechnen', addPoint: 'Datenpunkt Hinzufügen', remove: 'Entfernen', result: 'Ergebnis', equation: 'Gleichung', rSquared: 'R²-Wert', confidence: 'Konfidenz', extrapolatedValue: 'Extrapolierter Wert', export: 'Exportieren', csv: 'CSV Exportieren', png: 'PNG Exportieren', pdf: 'PDF Exportieren', invalid: 'Bitte gültige Zahlen eingeben', minPoints: 'Mindestens 2 Datenpunkte erforderlich', dataPoints: 'Datenpunkte', chartLoading: 'Diagramm wird geladen...', noscript: 'Für den interaktiven Rechner ist JavaScript erforderlich.' },
  it: { title: 'Calcolatore di Estrapolazione', subtitle: 'Prevedi valori futuri', method: 'Metodo', targetX: 'Valore X Target', calculate: 'Calcola', addPoint: 'Aggiungi Punto', remove: 'Rimuovi', result: 'Risultato', equation: 'Equazione', rSquared: 'Punteggio R²', confidence: 'Confidenza', extrapolatedValue: 'Valore Estrapolato', export: 'Esporta', csv: 'Esporta CSV', png: 'Esporta PNG', pdf: 'Esporta PDF', invalid: 'Inserisci numeri validi', minPoints: 'Sono necessari almeno 2 punti', dataPoints: 'Punti Dati', chartLoading: 'Caricamento grafico...', noscript: 'JavaScript è richiesto per il calcolatore interattivo.' },
  pt: { title: 'Calculadora de Extrapolação', subtitle: 'Preveja valores futuros', method: 'Método', targetX: 'Valor X Alvo', calculate: 'Calcular', addPoint: 'Adicionar Ponto', remove: 'Remover', result: 'Resultado', equation: 'Equação', rSquared: 'Pontuação R²', confidence: 'Confiança', extrapolatedValue: 'Valor Extrapolaado', export: 'Exportar', csv: 'Exportar CSV', png: 'Exportar PNG', pdf: 'Exportar PDF', invalid: 'Insira números válidos', minPoints: 'São necessários pelo menos 2 pontos', dataPoints: 'Pontos de Dados', chartLoading: 'Carregando gráfico...', noscript: 'JavaScript é necessário para a calculadora interativa.' },
  bn: { title: 'বহির্বহন ক্যালকুলেটর', subtitle: 'আপনার ডেটা থেকে ভবিষ্যৎ মান অনুমান করুন', method: 'পদ্ধতি', targetX: 'লক্ষ্য X', calculate: 'গণনা করুন', addPoint: 'ডেটা পয়েন্ট যোগ করুন', remove: 'সরান', result: 'ফলাফল', equation: 'সমীকরণ', rSquared: 'R² স্কোর', confidence: 'আস্থা', extrapolatedValue: 'বহির্বহন মান', export: 'রপ্তানি', csv: 'CSV রপ্তানি', png: 'PNG রপ্তানি', pdf: 'PDF রপ্তানি', invalid: 'অনুগ্রহ করে বৈধ সংখ্যা দিন', minPoints: 'কমপক্ষে ২টি ডেটা পয়েন্ট প্রয়োজন', dataPoints: 'ডেটা পয়েন্ট', chartLoading: 'চার্ট লোড হচ্ছে...', noscript: 'ইন্টারেক্টিভ ক্যালকুলেটরের জন্য JavaScript প্রয়োজন।' },
  ja: { title: '外挿計算機', subtitle: 'データから将来の値を予測', method: '手法', targetX: '目標X値', calculate: '計算', addPoint: 'データポイント追加', remove: '削除', result: '結果', equation: '方程式', rSquared: 'R²スコア', confidence: '信頼度', extrapolatedValue: '外挿値', export: 'エクスポート', csv: 'CSVエクスポート', png: 'PNGエクスポート', pdf: 'PDFエクスポート', invalid: '有効な数値を入力してください', minPoints: '2つ以上のデータポイントが必要です', dataPoints: 'データポイント', chartLoading: 'チャート読み込み中...', noscript: 'インタラクティブ計算機にはJavaScriptが必要です。' },
  ko: { title: '외삽 계산기', subtitle: '데이터로 미래 값 예측', method: '방법', targetX: '목표 X 값', calculate: '계산', addPoint: '데이터 포인트 추가', remove: '삭제', result: '결과', equation: '방정식', rSquared: 'R² 점수', confidence: '신뢰도', extrapolatedValue: '외삽 값', export: '내보내기', csv: 'CSV 내보내기', png: 'PNG 내보내기', pdf: 'PDF 내보내기', invalid: '유효한 숫자를 입력하세요', minPoints: '최소 2개의 데이터 포인트가 필요합니다', dataPoints: '데이터 포인트', chartLoading: '차트 로딩 중...', noscript: '인터랙티브 계산기에는 JavaScript가 필요합니다.' },
  ms: { title: 'Kalkulator Ekstrapolasi', subtitle: 'Ramal nilai masa hadapan', method: 'Kaedah', targetX: 'Nilai X Sasaran', calculate: 'Kira', addPoint: 'Tambah Titik Data', remove: 'Buang', result: 'Keputusan', equation: 'Persamaan', rSquared: 'Skor R²', confidence: 'Keyakinan', extrapolatedValue: 'Nilai Ekstrapolasi', export: 'Eksport', csv: 'Eksport CSV', png: 'Eksport PNG', pdf: 'Eksport PDF', invalid: 'Sila masukkan nombor yang sah', minPoints: 'Sekurang-kurangnya 2 titik data diperlukan', dataPoints: 'Titik Data', chartLoading: 'Memuatkan carta...', noscript: 'JavaScript diperlukan untuk kalkulator interaktif.' },
  pl: { title: 'Kalkulator Ekstrapolacji', subtitle: 'Przewiduj przyszłe wartości', method: 'Metoda', targetX: 'Docelowe X', calculate: 'Oblicz', addPoint: 'Dodaj Punkt', remove: 'Usuń', result: 'Wynik', equation: 'Równanie', rSquared: 'Wynik R²', confidence: 'Pewność', extrapolatedValue: 'Wartość Ekstrapolowana', export: 'Eksportuj', csv: 'Eksportuj CSV', png: 'Eksportuj PNG', pdf: 'Eksportuj PDF', invalid: 'Podaj prawidłowe liczby', minPoints: 'Wymagane co najmniej 2 punkty', dataPoints: 'Punkty Danych', chartLoading: 'Ładowanie wykresu...', noscript: 'Kalkulator interaktywny wymaga JavaScript.' },
  id: { title: 'Kalkulator Ekstrapolasi', subtitle: 'Prediksi nilai masa depan', method: 'Metode', targetX: 'Nilai X Target', calculate: 'Hitung', addPoint: 'Tambah Titik Data', remove: 'Hapus', result: 'Hasil', equation: 'Persamaan', rSquared: 'Skor R²', confidence: 'Kepercayaan', extrapolatedValue: 'Nilai Ekstrapolasi', export: 'Ekspor', csv: 'Ekspor CSV', png: 'Ekspor PNG', pdf: 'Ekspor PDF', invalid: 'Masukkan angka yang valid', minPoints: 'Minimal 2 titik data diperlukan', dataPoints: 'Titik Data', chartLoading: 'Memuat grafik...', noscript: 'JavaScript diperlukan untuk kalkulator interaktif.' },
  ar: { title: 'حاسبة الاستكمال الخارجي', subtitle: 'تنبأ بالقيم المستقبلية', method: 'طريقة', targetX: 'القيمة المستهدفة X', calculate: 'احسب', addPoint: 'إضافة نقطة بيانات', remove: 'إزالة', result: 'النتيجة', equation: 'المعادلة', rSquared: 'درجة R²', confidence: 'الثقة', extrapolatedValue: 'القيمة المستكملة', export: 'تصدير', csv: 'تصدير CSV', png: 'تصدير PNG', pdf: 'تصدير PDF', invalid: 'أدخل أرقامًا صالحة', minPoints: 'مطلوب نقطتي بيانات على الأقل', dataPoints: 'نقاط البيانات', chartLoading: 'جاري تحميل الرسم البياني...', noscript: 'JavaScript مطلوب للآلة الحاسبة التفاعلية.' },
  bg: { title: 'Калкулатор за Екстраполация', subtitle: 'Прогнозирайте бъдещи стойности', method: 'Метод', targetX: 'Целева X Стойност', calculate: 'Изчисли', addPoint: 'Добави Точка', remove: 'Премахни', result: 'Резултат', equation: 'Уравнение', rSquared: 'R² Резултат', confidence: 'Доверие', extrapolatedValue: 'Екстраполирана Стойност', export: 'Експорт', csv: 'Експорт CSV', png: 'Експорт PNG', pdf: 'Експорт PDF', invalid: 'Въведете валидни числа', minPoints: 'Необходими са поне 2 точки', dataPoints: 'Точки Данни', chartLoading: 'Зареждане на графиката...', noscript: 'За интерактивния калкулатор е необходим JavaScript.' },
  tr: { title: 'Ekstrapolasyon Hesaplayıcısı', subtitle: 'Gelecek değerleri tahmin edin', method: 'Yöntem', targetX: 'Hedef X Değeri', calculate: 'Hesapla', addPoint: 'Veri Noktası Ekle', remove: 'Kaldır', result: 'Sonuç', equation: 'Denklem', rSquared: 'R² Skoru', confidence: 'Güven', extrapolatedValue: 'Ekstrapole Edilen Değer', export: 'Dışa Aktar', csv: 'CSV Dışa Aktar', png: 'PNG Dışa Aktar', pdf: 'PDF Dışa Aktar', invalid: 'Geçerli sayılar girin', minPoints: 'En az 2 veri noktası gerekli', dataPoints: 'Veri Noktaları', chartLoading: 'Grafik yükleniyor...', noscript: 'İnteraktif hesaplayıcı için JavaScript gereklidir.' },
  sv: { title: 'Extrapoleringskalkylator', subtitle: 'Förutsäg framtida värden', method: 'Metod', targetX: 'Målvärde X', calculate: 'Beräkna', addPoint: 'Lägg Till Datapunkt', remove: 'Ta Bort', result: 'Resultat', equation: 'Ekvation', rSquared: 'R²-poäng', confidence: 'Förtroende', extrapolatedValue: 'Extrapolerat Värde', export: 'Exportera', csv: 'Exportera CSV', png: 'Exportera PNG', pdf: 'Exportera PDF', invalid: 'Ange giltiga siffror', minPoints: 'Minst 2 datapunkter krävs', dataPoints: 'Datapunkter', chartLoading: 'Laddar diagram...', noscript: 'JavaScript krävs för den interaktiva kalkylatorn.' },
};

function L(key: string, locale: string): string {
  const l = locale || 'en';
  return uiLabels[l]?.[key] ?? uiLabels.en[key] ?? key;
}

export default function ExtrapolationCalculator({ locale = 'en' }: Props) {
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
  };

  const handleExportCSV = () => {
    const validPoints = inputRows
      .map((r) => ({ x: Number(r.x), y: Number(r.y) }))
      .filter((p) => !isNaN(p.x) && !isNaN(p.y));
    const content = exportToCSV(validPoints, result ?? undefined);
    downloadCSV(content, 'extrapolation-result.csv');
  };

  const handleExportPNG = () => downloadPNG(chartRef.current, 'extrapolation-chart.png');

  const handleExportPDF = () => {
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
    <div className="calculator-card p-6 md:p-8 max-w-4xl mx-auto dark:bg-neutral-900 dark:border-neutral-700" role="application" aria-label={L('title', locale)}>
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">{L('title', locale)}</h1>
        <p className="text-neutral-500 dark:text-neutral-400">{L('subtitle', locale)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 calculator-inputs">
        <div>
          <label htmlFor="method-select" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {L('method', locale)}
          </label>
          <select
            id="method-select"
            value={method}
            onChange={(e) => setMethod(e.target.value as MethodKey)}
            className="w-full border border-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            aria-label={L('method', locale)}
          >
            {Object.entries(methodLabels).map(([key, labelMap]) => (
              <option value={key} key={key}>{labelMap[locale] ?? labelMap.en}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="target-x-input" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {L('targetX', locale)}
          </label>
          <input
            id="target-x-input"
            type="number"
            step="any"
            value={targetX}
            onChange={(e) => setTargetX(e.target.value)}
            className="w-full border border-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            aria-label={L('targetX', locale)}
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{L('dataPoints', locale)}</h2>
          <button
            onClick={addRow}
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
            aria-label={L('addPoint', locale)}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            {L('addPoint', locale)}
          </button>
        </div>
        <div className="space-y-2" role="table" aria-label={L('dataPoints', locale)}>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-neutral-500 px-1" role="row">
            <span role="columnheader">X</span>
            <span role="columnheader">Y</span>
            <span className="w-8" role="columnheader"></span>
          </div>
          {inputRows.map((row, i) => (
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2" role="row" key={i}>
              <input
                type="number"
                step="any"
                value={row.x}
                onChange={(e) => updateRow(i, 'x', e.target.value)}
                aria-label={`Point ${i + 1} X value`}
                className={`border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-800 dark:text-neutral-100 ${errors[i] ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-neutral-200 dark:border-neutral-600'}`}
                role="cell"
              />
              <input
                type="number"
                step="any"
                value={row.y}
                onChange={(e) => updateRow(i, 'y', e.target.value)}
                aria-label={`Point ${i + 1} Y value`}
                className={`border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-800 dark:text-neutral-100 ${errors[i] ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-neutral-200 dark:border-neutral-600'}`}
                role="cell"
              />
              <button
                onClick={() => removeRow(i)}
                disabled={inputRows.length <= 2}
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-neutral-100"
                aria-label={`${L('remove', locale)} point ${i + 1}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={L('calculate', locale)}
      >
        {L('calculate', locale)}
      </button>

      {generalError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300" role="alert">
          {generalError}
        </div>
      )}

      {result && (
        <div className="mt-6 p-6 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700" role="region" aria-label={L('result', locale)}>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{L('result', locale)}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{L('extrapolatedValue', locale)}</p>
              <p className="text-xl font-bold text-primary">{result.value.toFixed(4)}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{L('equation', locale)}</p>
              <p className="text-sm font-mono text-neutral-800 dark:text-neutral-200 break-all">{result.equation}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{L('rSquared', locale)}</p>
              <p className="text-xl font-bold text-secondary">{(result.rSquared * 100).toFixed(2)}%</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{L('confidence', locale)}</p>
              <p className="text-xl font-bold text-accent">{result.confidence.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={handleExportCSV} className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors" aria-label={L('csv', locale)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              CSV
            </button>
            <button onClick={handleExportPNG} className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors" aria-label={L('png', locale)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              PNG
            </button>
            <button onClick={handleExportPDF} className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors" aria-label={L('pdf', locale)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              PDF
            </button>
          </div>
        </div>
      )}

      <div className="mt-8" aria-label="Extrapolation chart">
        <Suspense fallback={<div className="h-64 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse flex items-center justify-center text-neutral-400">{L('chartLoading', locale)}</div>}>
          <ExtrapolationChart
            points={inputRows.map((r) => ({ x: Number(r.x), y: Number(r.y) })).filter((p) => !isNaN(p.x) && !isNaN(p.y))}
            result={result}
            targetX={Number(targetX) || 0}
            method={method}
            ref={chartRef}
          />
        </Suspense>
      </div>

      <noscript>
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          {L('noscript', locale)}
        </div>
      </noscript>
    </div>
  );
}
