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

const methodDescriptions: Record<MethodKey, { title: string; description: string; icon: string }> = {
  linear: {
    title: 'Linear Growth',
    description: 'Constant rate of change. Best for steady trends like monthly revenue or temperature increases.',
    icon: 'M4 12h16M4 12l4-4m-4 4l4 4',
  },
  exponential: {
    title: 'Exponential Growth',
    description: 'Accelerating growth. Ideal for population, viral spread, compound interest, or bacterial colonies.',
    icon: 'M3 17c3-4 6-7 12-7M3 17l4-4m-4 4l4 4',
  },
  logarithmic: {
    title: 'Logarithmic Decay',
    description: 'Rapid initial change that slows over time. Perfect for learning curves or diminishing returns.',
    icon: 'M3 7c3 4 6 7 12 7M3 7l4 4m-4-4l4-4',
  },
  polynomial: {
    title: 'Polynomial Curve',
    description: 'Complex multi-directional trends. Use for data with peaks and valleys like market cycles.',
    icon: 'M3 12c2-4 4-6 8-6s6 2 8 6-2 6-6 6-6-2-8-6',
  },
  quadratic: {
    title: 'Quadratic Parabola',
    description: 'U-shaped or inverted U trends. Great for projectile motion or profit maximization curves.',
    icon: 'M4 16c2-6 6-10 10-10s8 4 10 10',
  },
};

const demoDatasets: Record<string, { label: string; rows: { x: string; y: string }[]; targetX: string; context: string }> = {
  temperature: {
    label: 'Temperature Trend',
    context: 'Day of month → Temperature (°C)',
    rows: [
      { x: '1', y: '18.5' }, { x: '5', y: '20.2' }, { x: '10', y: '22.8' },
      { x: '15', y: '25.1' }, { x: '20', y: '27.4' }, { x: '25', y: '29.2' },
    ],
    targetX: '30',
  },
  sales: {
    label: 'Monthly Sales',
    context: 'Month → Revenue ($K)',
    rows: [
      { x: '1', y: '12.5' }, { x: '2', y: '14.2' }, { x: '3', y: '16.8' },
      { x: '4', y: '19.5' }, { x: '5', y: '22.1' }, { x: '6', y: '25.4' },
    ],
    targetX: '9',
  },
  population: {
    label: 'Population Growth',
    context: 'Year → Population (millions)',
    rows: [
      { x: '2018', y: '100' }, { x: '2019', y: '105' }, { x: '2020', y: '110.3' },
      { x: '2021', y: '115.8' }, { x: '2022', y: '121.6' }, { x: '2023', y: '127.7' },
    ],
    targetX: '2028',
  },
  custom: {
    label: 'Custom Data',
    context: 'Enter your own data points',
    rows: [{ x: '1', y: '2' }, { x: '2', y: '4' }, { x: '3', y: '6' }],
    targetX: '5',
  },
};

const uiLabels: Record<string, Record<string, string>> = {
  en: { title: 'Extrapolation Calculator', subtitle: 'Predict future values beyond your data range', method: 'Method', targetX: 'Target X', calculate: 'Calculate', addPoint: 'Add Data Point', remove: 'Remove', result: 'Result', equation: 'Equation', rSquared: 'R² Score', confidence: 'Confidence', extrapolatedValue: 'Extrapolated Value', export: 'Export', csv: 'Export CSV', png: 'Export PNG', pdf: 'Export PDF', invalid: 'Please enter valid numbers', minPoints: 'At least 2 data points required', dataPoints: 'Data Points', chartLoading: 'Loading chart...', noscript: 'JavaScript is required for the interactive calculator.', demoData: 'Demo Data', custom: 'Custom' },
  es: { title: 'Calculadora de Extrapolación', subtitle: 'Predice valores futuros más allá de tu rango de datos', method: 'Método', targetX: 'Valor X Objetivo', calculate: 'Calcular', addPoint: 'Agregar Punto', remove: 'Eliminar', result: 'Resultado', equation: 'Ecuación', rSquared: 'Puntuación R²', confidence: 'Confianza', extrapolatedValue: 'Valor Extrapolado', export: 'Exportar', csv: 'Exportar CSV', png: 'Exportar PNG', pdf: 'Exportar PDF', invalid: 'Ingrese números válidos', minPoints: 'Se necesitan al menos 2 puntos', dataPoints: 'Puntos de Datos', chartLoading: 'Cargando gráfico...', noscript: 'Se requiere JavaScript.', demoData: 'Datos Demo', custom: 'Personalizado' },
  fr: { title: "Calculateur d'Extrapolation", subtitle: 'Prédisez les valeurs futures au-delà de votre plage de données', method: 'Méthode', targetX: 'Valeur X Cible', calculate: 'Calculer', addPoint: 'Ajouter un Point', remove: 'Supprimer', result: 'Résultat', equation: 'Équation', rSquared: 'Score R²', confidence: 'Confiance', extrapolatedValue: 'Valeur Extrapolée', export: 'Exporter', csv: 'Exporter CSV', png: 'Exporter PNG', pdf: 'Exporter PDF', invalid: 'Entrez des nombres valides', minPoints: 'Au moins 2 points nécessaires', dataPoints: 'Points de Données', chartLoading: 'Chargement du graphique...', noscript: 'JavaScript est requis.', demoData: 'Données Démo', custom: 'Personnalisé' },
  de: { title: 'Extrapolationsrechner', subtitle: 'Zukünftige Werte über Ihren Datenbereich hinaus vorhersagen', method: 'Methode', targetX: 'Ziel-X-Wert', calculate: 'Berechnen', addPoint: 'Datenpunkt Hinzufügen', remove: 'Entfernen', result: 'Ergebnis', equation: 'Gleichung', rSquared: 'R²-Wert', confidence: 'Konfidenz', extrapolatedValue: 'Extrapolierter Wert', export: 'Exportieren', csv: 'CSV Exportieren', png: 'PNG Exportieren', pdf: 'PDF Exportieren', invalid: 'Bitte gültige Zahlen eingeben', minPoints: 'Mindestens 2 Datenpunkte erforderlich', dataPoints: 'Datenpunkte', chartLoading: 'Diagramm wird geladen...', noscript: 'JavaScript ist erforderlich.', demoData: 'Demo-Daten', custom: 'Benutzerdefiniert' },
  ja: { title: '外挿計算機', subtitle: 'データ範囲を超えて将来の値を予測', method: '手法', targetX: '目標X値', calculate: '計算', addPoint: 'データポイント追加', remove: '削除', result: '結果', equation: '方程式', rSquared: 'R²スコア', confidence: '信頼度', extrapolatedValue: '外挿値', export: 'エクスポート', csv: 'CSVエクスポート', png: 'PNGエクスポート', pdf: 'PDFエクスポート', invalid: '有効な数値を入力してください', minPoints: '2つ以上のデータポイントが必要です', dataPoints: 'データポイント', chartLoading: 'チャート読み込み中...', noscript: 'JavaScriptが必要です。', demoData: 'デモデータ', custom: 'カスタム' },
  ko: { title: '외삽 계산기', subtitle: '데이터 범위를 넘어 미래 값 예측', method: '방법', targetX: '목표 X 값', calculate: '계산', addPoint: '데이터 포인트 추가', remove: '삭제', result: '결과', equation: '방정식', rSquared: 'R² 점수', confidence: '신뢰도', extrapolatedValue: '외삽 값', export: '보내기', csv: 'CSV보내기', png: 'PNG보내기', pdf: 'PDF보내기', invalid: '유효한 숫자를 입력하세요', minPoints: '최소 2개의 데이터 포인트가 필요합니다', dataPoints: '데이터 포인트', chartLoading: '차트 로딩 중...', noscript: 'JavaScript가 필요합니다.', demoData: '데모 데이터', custom: '사용자 정의' },
  ar: { title: 'حاسبة الاستكمال الخارجي', subtitle: 'تنبأ بالقيم المستقبلية خارج نطاق بياناتك', method: 'طريقة', targetX: 'القيمة المستهدفة X', calculate: 'احسب', addPoint: 'إضافة نقطة بيانات', remove: 'إزالة', result: 'النتيجة', equation: 'المعادلة', rSquared: 'درجة R²', confidence: 'الثقة', extrapolatedValue: 'القيمة المستكملة', export: 'تصدير', csv: 'تصدير CSV', png: 'تصدير PNG', pdf: 'تصدير PDF', invalid: 'أدخل أرقامًا صالحة', minPoints: 'مطلوب نقطتي بيانات على الأقل', dataPoints: 'نقاط البيانات', chartLoading: 'جاري تحميل الرسم البياني...', noscript: 'JavaScript مطلوب.', demoData: 'بيانات تجريبية', custom: 'مخصص' },
  it: { title: 'Calcolatore di Estrapolazione', subtitle: 'Prevedi valori futuri oltre il tuo intervallo di dati', method: 'Metodo', targetX: 'Valore X Target', calculate: 'Calcola', addPoint: 'Aggiungi Punto', remove: 'Rimuovi', result: 'Risultato', equation: 'Equazione', rSquared: 'Punteggio R²', confidence: 'Confidenza', extrapolatedValue: 'Valore Estrapolato', export: 'Esporta', csv: 'Esporta CSV', png: 'Esporta PNG', pdf: 'Esporta PDF', invalid: 'Inserisci numeri validi', minPoints: 'Sono necessari almeno 2 punti', dataPoints: 'Punti Dati', chartLoading: 'Caricamento grafico...', noscript: 'JavaScript è richiesto.', demoData: 'Dati Demo', custom: 'Personalizzato' },
  pt: { title: 'Calculadora de Extrapolação', subtitle: 'Preveja valores futuros além do seu intervalo de dados', method: 'Método', targetX: 'Valor X Alvo', calculate: 'Calcular', addPoint: 'Adicionar Ponto', remove: 'Remover', result: 'Resultado', equation: 'Equação', rSquared: 'Pontuação R²', confidence: 'Confiança', extrapolatedValue: 'Valor Extrapolaado', export: 'Exportar', csv: 'Exportar CSV', png: 'Exportar PNG', pdf: 'Exportar PDF', invalid: 'Insira números válidos', minPoints: 'São necessários pelo menos 2 pontos', dataPoints: 'Pontos de Dados', chartLoading: 'Carregando gráfico...', noscript: 'JavaScript é necessário.', demoData: 'Dados Demo', custom: 'Personalizado' },
  ru: { title: 'Калькулятор Экстраполяции', subtitle: 'Прогнозируйте будущие значения за пределами вашего диапазона данных', method: 'Метод', targetX: 'Целевое X', calculate: 'Вычислить', addPoint: 'Добавить Точку', remove: 'Удалить', result: 'Результат', equation: 'Уравнение', rSquared: 'Оценка R²', confidence: 'Доверие', extrapolatedValue: 'Экстраполированное Значение', export: 'Экспорт', csv: 'Экспорт CSV', png: 'Экспорт PNG', pdf: 'Экспорт PDF', invalid: 'Введите корректные числа', minPoints: 'Необходимо минимум 2 точки', dataPoints: 'Точки Данных', chartLoading: 'Загрузка графика...', noscript: 'Требуется JavaScript.', demoData: 'Демо-данные', custom: 'Пользовательский' },
  hi: { title: 'बाह्यगणना कैलकुलेटर', subtitle: 'अपने डेटा सीमा से परे भविष्य के मानों की भविष्यवाणी करें', method: 'विधि', targetX: 'लक्ष्य X', calculate: 'गणना करें', addPoint: 'डेटा बिंदु जोड़ें', remove: 'हटाएं', result: 'परिणाम', equation: 'समीकरण', rSquared: 'R² स्कोर', confidence: 'विश्वास', extrapolatedValue: 'बाह्यगणित मान', export: 'निर्यात', csv: 'CSV निर्यात', png: 'PNG निर्यात', pdf: 'PDF निर्यात', invalid: 'कृपया मान्य संख्या दर्ज करें', minPoints: 'कम से कम 2 डेटा बिंदु आवश्यक', dataPoints: 'डेटा बिंदु', chartLoading: 'चार्ट लोड हो रहा है...', noscript: 'JavaScript आवश्यक है।', demoData: 'डेमो डेटा', custom: 'कस्टम' },
  bn: { title: 'বহির্বহন ক্যালকুলেটর', subtitle: 'আপনার ডেটা পরিসীমার বাইরে ভবিষ্যৎ মান অনুমান করুন', method: 'পদ্ধতি', targetX: 'লক্ষ্য X', calculate: 'গণনা করুন', addPoint: 'ডেটা পয়েন্ট যোগ করুন', remove: 'সরান', result: 'ফলাফল', equation: 'সমীকরণ', rSquared: 'R² স্কোর', confidence: 'আস্থা', extrapolatedValue: 'বহির্বহন মান', export: 'রপ্তানি', csv: 'CSV রপ্তানি', png: 'PNG রপ্তানি', pdf: 'PDF রপ্তানি', invalid: 'অনুগ্রহ করে বৈধ সংখ্যা দিন', minPoints: 'কমপক্ষে ২টি ডেটা পয়েন্ট প্রয়োজন', dataPoints: 'ডেটা পয়েন্ট', chartLoading: 'চার্ট লোড হচ্ছে...', noscript: 'JavaScript প্রয়োজন।', demoData: 'ডেমো ডেটা', custom: 'কাস্টম' },
  ms: { title: 'Kalkulator Ekstrapolasi', subtitle: 'Ramal nilai masa hadapan di luar julat data anda', method: 'Kaedah', targetX: 'Nilai X Sasaran', calculate: 'Kira', addPoint: 'Tambah Titik Data', remove: 'Buang', result: 'Keputusan', equation: 'Persamaan', rSquared: 'Skor R²', confidence: 'Keyakinan', extrapolatedValue: 'Nilai Ekstrapolasi', export: 'Eksport', csv: 'Eksport CSV', png: 'Eksport PNG', pdf: 'Eksport PDF', invalid: 'Sila masukkan nombor yang sah', minPoints: 'Sekurang-kurangnya 2 titik data diperlukan', dataPoints: 'Titik Data', chartLoading: 'Memuatkan carta...', noscript: 'JavaScript diperlukan.', demoData: 'Data Demo', custom: 'Tersuai' },
  pl: { title: 'Kalkulator Ekstrapolacji', subtitle: 'Przewiduj przyszłe wartości poza zakresem danych', method: 'Metoda', targetX: 'Docelowe X', calculate: 'Oblicz', addPoint: 'Dodaj Punkt', remove: 'Usuń', result: 'Wynik', equation: 'Równanie', rSquared: 'Wynik R²', confidence: 'Pewność', extrapolatedValue: 'Wartość Ekstrapolowana', export: 'Eksportuj', csv: 'Eksportuj CSV', png: 'Eksportuj PNG', pdf: 'Eksportuj PDF', invalid: 'Podaj prawidłowe liczby', minPoints: 'Wymagane co najmniej 2 punkty', dataPoints: 'Punkty Danych', chartLoading: 'Ładowanie wykresu...', noscript: 'Wymagany jest JavaScript.', demoData: 'Dane Demo', custom: 'Niestandardowy' },
  id: { title: 'Kalkulator Ekstrapolasi', subtitle: 'Prediksi nilai masa depan di luar rentang data Anda', method: 'Metode', targetX: 'Nilai X Target', calculate: 'Hitung', addPoint: 'Tambah Titik Data', remove: 'Hapus', result: 'Hasil', equation: 'Persamaan', rSquared: 'Skor R²', confidence: 'Kepercayaan', extrapolatedValue: 'Nilai Ekstrapolasi', export: 'Ekspor', csv: 'Ekspor CSV', png: 'Ekspor PNG', pdf: 'Ekspor PDF', invalid: 'Masukkan angka yang valid', minPoints: 'Minimal 2 titik data diperlukan', dataPoints: 'Titik Data', chartLoading: 'Memuat grafik...', noscript: 'Diperlukan JavaScript.', demoData: 'Data Demo', custom: 'Kustom' },
  bg: { title: 'Калкулатор за Екстраполация', subtitle: 'Прогнозирайте бъдещи стойности извън обхвата на данните', method: 'Метод', targetX: 'Целева X Стойност', calculate: 'Изчисли', addPoint: 'Добави Точка', remove: 'Премахни', result: 'Резултат', equation: 'Уравнение', rSquared: 'R² Резултат', confidence: 'Доверие', extrapolatedValue: 'Екстраполирана Стойност', export: 'Експорт', csv: 'Експорт CSV', png: 'Експорт PNG', pdf: 'Експорт PDF', invalid: 'Въведете валидни числа', minPoints: 'Необходими са поне 2 точки', dataPoints: 'Точки Данни', chartLoading: 'Зареждане на графиката...', noscript: 'Необходим е JavaScript.', demoData: 'Демо Данни', custom: 'Персонализиран' },
  tr: { title: 'Ekstrapolasyon Hesaplayıcısı', subtitle: 'Veri aralığınızın ötesinde gelecek değerleri tahmin edin', method: 'Yöntem', targetX: 'Hedef X Değeri', calculate: 'Hesapla', addPoint: 'Veri Noktası Ekle', remove: 'Kaldır', result: 'Sonuç', equation: 'Denklem', rSquared: 'R² Skoru', confidence: 'Güven', extrapolatedValue: 'Ekstrapole Edilen Değer', export: 'Dışa Aktar', csv: 'CSV Dışa Aktar', png: 'PNG Dışa Aktar', pdf: 'PDF Dışa Aktar', invalid: 'Geçerli sayılar girin', minPoints: 'En az 2 veri noktası gerekli', dataPoints: 'Veri Noktaları', chartLoading: 'Grafik yükleniyor...', noscript: 'JavaScript gereklidir.', demoData: 'Demo Verileri', custom: 'Özel' },
  sv: { title: 'Extrapoleringskalkylator', subtitle: 'Förutsäg framtida värden utanför din dataräckvidd', method: 'Metod', targetX: 'Målvärde X', calculate: 'Beräkna', addPoint: 'Lägg Till Datapunkt', remove: 'Ta Bort', result: 'Resultat', equation: 'Ekvation', rSquared: 'R²-poäng', confidence: 'Förtroende', extrapolatedValue: 'Extrapolerat Värde', export: 'Exportera', csv: 'Exportera CSV', png: 'Exportera PNG', pdf: 'Exportera PDF', invalid: 'Ange giltiga siffror', minPoints: 'Minst 2 datapunkter krävs', dataPoints: 'Datapunkter', chartLoading: 'Laddar diagram...', noscript: 'JavaScript krävs.', demoData: 'Demodata', custom: 'Anpassad' },
};

function L(key: string, locale: string): string {
  const l = locale || 'en';
  return uiLabels[l]?.[key] ?? uiLabels.en[key] ?? key;
}

function MethodIllustration({ method }: { method: MethodKey }) {
  const desc = methodDescriptions[method];
  return (
    <div className="method-illustration mb-8">
      <svg viewBox="0 0 320 120" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <g className="text-neutral-200 dark:text-neutral-700" strokeWidth="1">
          {[0, 80, 160, 240, 320].map(x => <line key={`vx${x}`} x1={x} y1={0} x2={x} y2={120} />)}
          {[0, 30, 60, 90, 120].map(y => <line key={`hy${y}`} x1={0} y1={y} x2={320} y2={y} />)}
        </g>
        {[
          [40, 90], [100, 70], [160, 50], [220, 35], [260, 25]
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="#D4A853" stroke="none" />
        ))}
        {method === 'linear' && (
          <line x1="20" y1="100" x2="300" y2="20" className="text-gold-500" strokeDasharray="4" />
        )}
        {method === 'exponential' && (
          <path d="M20 100 Q100 80 160 60 T300 10" className="text-gold-400" fill="none" strokeDasharray="4" />
        )}
        {method === 'logarithmic' && (
          <path d="M20 20 Q80 30 120 50 T300 100" className="text-gold-300" fill="none" strokeDasharray="4" />
        )}
        {method === 'polynomial' && (
          <path d="M20 60 Q80 20 140 60 T220 30 T300 70" className="text-gold-500" fill="none" strokeDasharray="4" />
        )}
        {method === 'quadratic' && (
          <path d="M20 100 Q160 0 300 100" className="text-gold-400" fill="none" strokeDasharray="4" />
        )}
        <g className="text-gold-600">
          <line x1="260" y1="25" x2="290" y2="15" />
          <polygon points="295,12 290,15 292,20" fill="currentColor" stroke="none" />
        </g>
        <text x="160" y="115" textAnchor="middle" className="text-neutral-400 dark:text-neutral-500" style={{ fontSize: '10px', fill: 'currentColor', stroke: 'none' }}>X →</text>
        <text x="10" y="60" textAnchor="middle" className="text-neutral-400 dark:text-neutral-500" style={{ fontSize: '10px', fill: 'currentColor', stroke: 'none' }} transform="rotate(-90 10 60)">Y →</text>
      </svg>
    </div>
  );
}

export default function ExtrapolationCalculator({ locale = 'en' }: Props) {
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
    <div className="calculator-card p-6 md:p-10 max-w-5xl mx-auto" role="application" aria-label={L('title', locale)}>
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-3 tracking-tight">{L('title', locale)}</h1>
        <div className="gold-divider-wide mb-4" />
        <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed font-light">{L('subtitle', locale)}</p>
      </div>

      <MethodIllustration method={method} />

      {/* Method Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap justify-center">
        {(['linear', 'exponential', 'logarithmic', 'polynomial', 'quadratic'] as MethodKey[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={method === m ? 'btn-tab-active' : 'btn-tab-inactive'}
            aria-pressed={method === m}
          >
            {methodLabels[m][locale] ?? methodLabels[m].en}
          </button>
        ))}
      </div>

      {/* Method Description */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-gold-500/5 to-gold-600/5 dark:from-gold-500/10 dark:to-gold-600/10 border border-gold-500/10 dark:border-gold-500/20 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="h-6 w-6 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={methodDescriptions[method].icon} />
            </svg>
          </div>
          <div>
            <h3 className="font-serif font-semibold text-neutral-900 dark:text-neutral-100 text-sm tracking-wide">{methodDescriptions[method].title}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1">{methodDescriptions[method].description}</p>
          </div>
        </div>
      </div>

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
              {ds.label}
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
            className="input-field"
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
            className="input-field"
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
                    className={errors[i] ? 'input-field-error py-2 w-full' : 'input-field py-2 w-full'}
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
                    className={errors[i] ? 'input-field-error py-2 w-full' : 'input-field py-2 w-full'}
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
        className="btn-calculate mb-2"
        aria-label={L('calculate', locale)}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {L('calculate', locale)}
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

          {/* Chart */}
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

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={handleExportCSV} className="btn-secondary" aria-label={L('csv', locale)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              CSV
            </button>
            <button onClick={handleExportPNG} className="btn-secondary" aria-label={L('png', locale)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              PNG
            </button>
            <button onClick={handleExportPDF} className="btn-secondary" aria-label={L('pdf', locale)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              PDF
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
