import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import type { Point, InterpolationResult } from '../utils/interpolation';
import { interpolationMethods } from '../utils/interpolation';
import { sanitizeInput, debounce, exportToCSV, downloadCSV, downloadPNG } from '../utils/validation';

const InterpolationChart = lazy(() => import('./InterpolationChart'));

type InterpMethod = 'linear' | 'lagrange' | 'spline';

interface Props {
  locale?: string;
  showChart?: boolean;
}

const methodLabels: Record<InterpMethod, Record<string, string>> = {
  linear: { en: 'Linear Interpolation', hi: 'रैखिक अंतरवेशन', es: 'Interpolación Lineal', ru: 'Линейная Интерполяция', fr: 'Interpolation Linéaire', de: 'Lineare Interpolation', it: 'Interpolazione Lineare', pt: 'Interpolação Linear', bn: 'রৈখিক অন্তর্বেশন', ja: '線形補間', ko: '선형 보간', ms: 'Interpolasi Linear', pl: 'Interpolacja Liniowa', id: 'Interpolasi Linear', ar: 'الاستكمال الخطي', bg: 'Линейна Интерполация', tr: 'Doğrusal İnterpolasyon', sv: 'Linjär Interpolation' },
  lagrange: { en: 'Lagrange Polynomial', hi: 'लग्रेंज बहुपद', es: 'Polinomio de Lagrange', ru: 'Полином Лагранжа', fr: 'Polynôme de Lagrange', de: 'Lagrange-Polynom', it: 'Polinomio di Lagrange', pt: 'Polinômio de Lagrange', bn: 'লাগ্রাঞ্জ বহুপদীয়', ja: 'ラグランジュ多項式', ko: '라그랑주 다항식', ms: 'Polinomial Lagrange', pl: 'Wielomian Lagrange\'a', id: 'Polinomial Lagrange', ar: 'كثير حدود لاغرانج', bg: 'Многочлен на Лагранж', tr: 'Lagrange Polinomu', sv: 'Lagrange-polynom' },
  spline: { en: 'Cubic Spline', hi: 'घन स्पलाइन', es: 'Spline Cúbico', ru: 'Кубический Сплайн', fr: 'Spline Cubique', de: 'Kubischer Spline', it: 'Spline Cubica', pt: 'Spline Cúbico', bn: 'কিউবিক স্প্লাইন', ja: '3次スプライン', ko: '3차 스플라인', ms: 'Spline Kubik', pl: 'Funkcja Sklejana', id: 'Spline Kubik', ar: 'شريحة تكعيبية', bg: 'Кубичен Сплайн', tr: 'Kübik Spline', sv: 'Kubisk Spline' },
};

const dummyDataByMethod: Record<InterpMethod, { rows: { x: string; y: string }[]; targetX: string; label: string }> = {
  linear: {
    label: 'Linear',
    rows: [
      { x: '8', y: '18.2' }, { x: '10', y: '21.5' }, { x: '12', y: '25.8' },
      { x: '14', y: '28.3' }, { x: '16', y: '26.1' },
    ],
    targetX: '13',
  },
  lagrange: {
    label: 'Lagrange',
    rows: [
      { x: '1', y: '1' }, { x: '2', y: '4' }, { x: '3', y: '9' },
      { x: '4', y: '16' }, { x: '5', y: '25' },
    ],
    targetX: '2.5',
  },
  spline: {
    label: 'Cubic Spline',
    rows: [
      { x: '0', y: '0' }, { x: '1', y: '0.5' }, { x: '2', y: '2' },
      { x: '3', y: '1.5' }, { x: '4', y: '3' },
    ],
    targetX: '2.5',
  },
};

const demoLabels: Record<string, Record<string, string>> = {
  en: { temperature: 'Hourly Temperature', stock: 'Stock Price', height: 'Child Growth', custom: 'Custom Data' },
  hi: { temperature: 'घंटेवार तापमान', stock: 'स्टॉक मूल्य', height: 'बच्चे की वृद्धि', custom: 'कस्टम डेटा' },
  es: { temperature: 'Temperatura Horaria', stock: 'Precio de Acciones', height: 'Crecimiento Infantil', custom: 'Datos Personalizados' },
  ru: { temperature: 'Почасовая Температура', stock: 'Цена Акций', height: 'Рост Ребёнка', custom: 'Пользовательские Данные' },
  fr: { temperature: 'Température Horaire', stock: 'Prix des Actions', height: 'Croissance de l\'Enfant', custom: 'Données Personnalisées' },
  de: { temperature: 'Stündliche Temperatur', stock: 'Aktienpreis', height: 'Kindeswachstum', custom: 'Benutzerdefinierte Daten' },
  it: { temperature: 'Temperatura Oraria', stock: 'Prezzo Azioni', height: 'Crescita del Bambino', custom: 'Dati Personalizzati' },
  pt: { temperature: 'Temperatura Horária', stock: 'Preço de Ações', height: 'Crescimento Infantil', custom: 'Dados Personalizados' },
  bn: { temperature: 'ঘণ্টার তাপমাত্রা', stock: 'স্টক মূল্য', height: 'শিশু বৃদ্ধি', custom: 'কাস্টম ডেটা' },
  ja: { temperature: '1時間ごとの気温', stock: '株価', height: '子供の成長', custom: 'カスタムデータ' },
  ko: { temperature: '시간별 온도', stock: '주식 가격', height: '어린이 성장', custom: '사용자 정의 데이터' },
  ms: { temperature: 'Suhu Sejam', stock: 'Harga Saham', height: 'Pertumbuhan Kanak-kanak', custom: 'Data Tersuai' },
  pl: { temperature: 'Temperatura Godzinowa', stock: 'Cena Akcji', height: 'Wzrost Dziecka', custom: 'Dane Niestandardowe' },
  id: { temperature: 'Suhu Per Jam', stock: 'Harga Saham', height: 'Pertumbuhan Anak', custom: 'Data Kustom' },
  ar: { temperature: 'الحرارة بالساعة', stock: 'سعر السهم', height: 'نمو الطفل', custom: 'بيانات مخصصة' },
  bg: { temperature: 'Почасова Температура', stock: 'Цена на Акциите', height: 'Растеж на Детето', custom: 'Персонализирани Данни' },
  tr: { temperature: 'Saatlik Sıcaklık', stock: 'Hisse Senedi Fiyatı', height: 'Çocuk Büyümesi', custom: 'Özel Veriler' },
  sv: { temperature: 'Timtemperatur', stock: 'Aktiekurs', height: 'Barns Tillväxt', custom: 'Anpassad Data' },
};

function getDemoLabel(key: string, locale: string): string {
  return demoLabels[locale]?.[key] ?? demoLabels.en[key] ?? key;
}

const demoDatasets: Record<string, { label: string; rows: { x: string; y: string }[]; targetX: string; context: string }> = {
  temperature: {
    label: 'Hourly Temperature',
    context: 'Hour → Temperature (°C)',
    rows: [
      { x: '8', y: '18.2' }, { x: '10', y: '21.5' }, { x: '12', y: '25.8' },
      { x: '14', y: '28.3' }, { x: '16', y: '26.1' }, { x: '18', y: '22.4' },
    ],
    targetX: '15',
  },
  stock: {
    label: 'Stock Price',
    context: 'Day → Stock Price ($)',
    rows: [
      { x: '1', y: '142.50' }, { x: '3', y: '145.20' }, { x: '5', y: '141.80' },
      { x: '7', y: '148.60' }, { x: '9', y: '152.30' }, { x: '11', y: '150.10' },
    ],
    targetX: '6',
  },
  height: {
    label: 'Child Growth',
    context: 'Age (months) → Height (cm)',
    rows: [
      { x: '6', y: '67.0' }, { x: '9', y: '71.5' }, { x: '12', y: '76.2' },
      { x: '15', y: '80.1' }, { x: '18', y: '83.4' }, { x: '24', y: '88.9' },
    ],
    targetX: '21',
  },
  custom: {
    label: 'Custom Data',
    context: 'Enter your own data points',
    rows: [{ x: '1', y: '2' }, { x: '3', y: '6' }, { x: '5', y: '10' }],
    targetX: '4',
  },
};

const ui: Record<string, Record<string, string>> = {
  en: { title: 'Interpolation Calculator', subtitle: 'Estimate values between known data points', method: 'Method', targetX: 'Target X', calculate: 'Calculate Now', addPoint: 'Add Point', remove: 'Remove', result: 'Result', steps: 'Steps', interpolatedValue: 'Interpolated Value', dataPoints: 'Data Points', invalid: 'Please enter valid numbers', minPoints: 'At least 2 data points required', maxPoints: 'Maximum 5 points for Lagrange', duplicateX: 'Duplicate X values are not allowed', rangeError: 'Target X outside spline range', demoData: 'Demo Data', custom: 'Custom', methodUsed: 'Method Used', loadExample: 'Load Example Data' },
  es: { title: 'Calculadora de Interpolación', subtitle: 'Estima valores entre puntos conocidos', method: 'Método', targetX: 'Valor X Objetivo', calculate: 'Interpolar', addPoint: 'Agregar Punto', remove: 'Eliminar', result: 'Resultado', steps: 'Pasos', interpolatedValue: 'Valor Interpolado', dataPoints: 'Puntos de Datos', invalid: 'Ingrese números válidos', minPoints: 'Se necesitan al menos 2 puntos', maxPoints: 'Máximo 5 puntos para Lagrange', duplicateX: 'Valores X duplicados no permitidos', rangeError: 'X objetivo fuera del rango del spline', demoData: 'Datos Demo', custom: 'Personalizado', methodUsed: 'Método Utilizado', loadExample: 'Cargar Datos de Ejemplo' },
  fr: { title: "Calculateur d'Interpolation", subtitle: 'Estimez les valeurs entre les points connus', method: 'Méthode', targetX: 'Valeur X Cible', calculate: 'Interpoler', addPoint: 'Ajouter un Point', remove: 'Supprimer', result: 'Résultat', steps: 'Étapes', interpolatedValue: 'Valeur Interpolée', dataPoints: 'Points de Données', invalid: 'Entrez des nombres valides', minPoints: 'Au moins 2 points nécessaires', maxPoints: 'Maximum 5 points pour Lagrange', duplicateX: 'Valeurs X en double non autorisées', rangeError: 'X cible hors plage du spline', demoData: 'Données Démo', custom: 'Personnalisé', methodUsed: 'Méthode Utilisée', loadExample: 'Charger les Données d\'exemple' },
  de: { title: 'Interpolationsrechner', subtitle: 'Schätzen Sie Werte zwischen bekannten Datenpunkten', method: 'Methode', targetX: 'Ziel-X-Wert', calculate: 'Interpolieren', addPoint: 'Punkt Hinzufügen', remove: 'Entfernen', result: 'Ergebnis', steps: 'Schritte', interpolatedValue: 'Interpolierter Wert', dataPoints: 'Datenpunkte', invalid: 'Bitte gültige Zahlen eingeben', minPoints: 'Mindestens 2 Punkte erforderlich', maxPoints: 'Maximal 5 Punkte für Lagrange', duplicateX: 'Doppelte X-Werte nicht erlaubt', rangeError: 'Ziel-X außerhalb des Spline-Bereichs', demoData: 'Demo-Daten', custom: 'Benutzerdefiniert', methodUsed: 'Verwendete Methode', loadExample: 'Beispieldaten Laden' },
  ja: { title: '補間計算機', subtitle: '既知のデータポイント間の値を推定', method: '手法', targetX: '目標X値', calculate: '補間', addPoint: 'ポイント追加', remove: '削除', result: '結果', steps: '手順', interpolatedValue: '補間値', dataPoints: 'データポイント', invalid: '有効な数値を入力してください', minPoints: '2つ以上のポイントが必要', maxPoints: 'ラグランジュは最大5点', duplicateX: '重複するX値は許可されません', rangeError: '目標Xがスプライン範囲外', demoData: 'デモデータ', custom: 'カスタム', methodUsed: '使用手法', loadExample: 'サンプルデータを読み込む' },
  ko: { title: '보간 계산기', subtitle: '알려진 데이터 포인트 사이의 값 추정', method: '방법', targetX: '목표 X 값', calculate: '보간', addPoint: '포인트 추가', remove: '삭제', result: '결과', steps: '단계', interpolatedValue: '보간 값', dataPoints: '데이터 포인트', invalid: '유효한 숫자를 입력하세요', minPoints: '최소 2개 포인트 필요', maxPoints: '라그랑주는 최대 5개', duplicateX: '중복 X 값은 허용되지 않습니다', rangeError: '목표 X가 스플라인 범위 밖', demoData: '데모 데이터', custom: '사용자 정의', methodUsed: '사용된 방법', loadExample: '샘플 데이터 로드' },
  ar: { title: 'حاسبة الاستكمال الداخلي', subtitle: 'تقدير القيم بين نقاط البيانات المعروفة', method: 'طريقة', targetX: 'القيمة المستهدفة X', calculate: 'استكمال', addPoint: 'إضافة نقطة', remove: 'إزالة', result: 'النتيجة', steps: 'الخطوات', interpolatedValue: 'القيمة المستكملة', dataPoints: 'نقاط البيانات', invalid: 'أدخل أرقامًا صالحة', minPoints: 'مطلوب نقطتي بيانات على الأقل', maxPoints: 'الحد الأقصى 5 نقاط للاغرانج', duplicateX: 'قيم X المكررة غير مسموح بها', rangeError: 'X المستهدف خارج نطاق الشريحة', demoData: 'بيانات تجريبية', custom: 'مخصص', methodUsed: 'الطريقة المستخدمة', loadExample: 'تحميل بيانات تجريبية' },
  it: { title: 'Calcolatore di Interpolazione', subtitle: 'Stima valori tra punti noti', method: 'Metodo', targetX: 'Valore X Target', calculate: 'Interpola', addPoint: 'Aggiungi Punto', remove: 'Rimuovi', result: 'Risultato', steps: 'Passaggi', interpolatedValue: 'Valore Interpolato', dataPoints: 'Punti Dati', invalid: 'Inserisci numeri validi', minPoints: 'Sono necessari almeno 2 punti', maxPoints: 'Massimo 5 punti per Lagrange', duplicateX: 'Valori X duplicati non ammessi', rangeError: 'X target fuori range spline', demoData: 'Dati Demo', custom: 'Personalizzato', methodUsed: 'Metodo Utilizzato', loadExample: 'Carica Dati di Esempio' },
  pt: { title: 'Calculadora de Interpolação', subtitle: 'Estime valores entre pontos conhecidos', method: 'Método', targetX: 'Valor X Alvo', calculate: 'Interpolar', addPoint: 'Adicionar Ponto', remove: 'Remover', result: 'Resultado', steps: 'Etapas', interpolatedValue: 'Valor Interpolado', dataPoints: 'Pontos de Dados', invalid: 'Insira números válidos', minPoints: 'Pelo menos 2 pontos necessários', maxPoints: 'Máximo 5 pontos para Lagrange', duplicateX: 'Valores X duplicados não permitidos', rangeError: 'X alvo fora do intervalo do spline', demoData: 'Dados Demo', custom: 'Personalizado', methodUsed: 'Método Utilizado', loadExample: 'Carregar Dados de Exemplo' },
  ru: { title: 'Калькулятор Интерполяции', subtitle: 'Оценка значений между известными точками', method: 'Метод', targetX: 'Целевое X', calculate: 'Интерполировать', addPoint: 'Добавить Точку', remove: 'Удалить', result: 'Результат', steps: 'Шаги', interpolatedValue: 'Интерполированное Значение', dataPoints: 'Точки Данных', invalid: 'Введите корректные числа', minPoints: 'Необходимо минимум 2 точки', maxPoints: 'Максимум 5 точек для Лагранжа', duplicateX: 'Дубликаты X не допускаются', rangeError: 'X вне диапазона сплайна', demoData: 'Демо-данные', custom: 'Пользовательский', methodUsed: 'Используемый Метод', loadExample: 'Загрузить Пример Данных' },
  hi: { title: 'अंतरवेशन कैलकुलेटर', subtitle: 'ज्ञात डेटा बिंदुओं के बीच मानों का अनुमान', method: 'विधि', targetX: 'लक्ष्य X', calculate: 'अंतरवेशन', addPoint: 'बिंदु जोड़ें', remove: 'हटाएं', result: 'परिणाम', steps: 'चरण', interpolatedValue: 'अंतरवेशित मान', dataPoints: 'डेटा बिंदु', invalid: 'कृपया मान्य संख्या दर्ज करें', minPoints: 'कम से कम 2 बिंदु आवश्यक', maxPoints: 'लग्रेंज के लिए अधिकतम 5 बिंदु', duplicateX: 'डुप्लिकेट X मान अनुमत नहीं', rangeError: 'लक्ष्य X स्प्लाइन सीमा से बाहर', demoData: 'डेमो डेटा', custom: 'कस्टम', methodUsed: 'उपयोग की गई विधि', loadExample: 'उदाहरण डेटा लोड करें' },
  bn: { title: 'অন্তর্বেশন ক্যালকুলেটর', subtitle: 'পরিচিত ডেটা পয়েন্টের মধ্যে মান অনুমান', method: 'পদ্ধতি', targetX: 'লক্ষ্য X', calculate: 'অন্তর্বেশন', addPoint: 'পয়েন্ট যোগ', remove: 'সরান', result: 'ফলাফল', steps: 'ধাপ', interpolatedValue: 'অন্তর্বেশিত মান', dataPoints: 'ডেটা পয়েন্ট', invalid: 'বৈধ সংখ্যা দিন', minPoints: 'কমপক্ষে ২টি পয়েন্ট প্রয়োজন', maxPoints: 'লাগ্রাঞ্জের জন্য সর্বোচ্চ ৫', duplicateX: 'ডুপ্লিকেট X অনুমোদিত নয়', rangeError: 'লক্ষ্য X স্প্লাইন সীমার বাইরে', demoData: 'ডেমো ডেটা', custom: 'কাস্টম', methodUsed: 'ব্যবহৃত পদ্ধতি', loadExample: 'উদাহরণ ডেটা লোড করুন' },
  ms: { title: 'Kalkulator Interpolasi', subtitle: 'Anggar nilai antara titik data yang diketahui', method: 'Kaedah', targetX: 'Nilai X Sasaran', calculate: 'Interpolasi', addPoint: 'Tambah Titik', remove: 'Buang', result: 'Keputusan', steps: 'Langkah', interpolatedValue: 'Nilai Interpolasi', dataPoints: 'Titik Data', invalid: 'Sila masukkan nombor yang sah', minPoints: 'Sekurang-kurangnya 2 titik diperlukan', maxPoints: 'Maksimum 5 titik untuk Lagrange', duplicateX: 'Nilai X pendua tidak dibenarkan', rangeError: 'X sasaran di luar julat spline', demoData: 'Data Demo', custom: 'Tersuai', methodUsed: 'Kaedah Digunakan', loadExample: 'Muat Data Contoh' },
  pl: { title: 'Kalkulator Interpolacji', subtitle: 'Szacuj wartości między znanymi punktami', method: 'Metoda', targetX: 'Docelowe X', calculate: 'Interpoluj', addPoint: 'Dodaj Punkt', remove: 'Usuń', result: 'Wynik', steps: 'Kroki', interpolatedValue: 'Wartość Interpolowana', dataPoints: 'Punkty Danych', invalid: 'Podaj prawidłowe liczby', minPoints: 'Wymagane co najmniej 2 punkty', maxPoints: 'Maksimum 5 punktów dla Lagrange\'a', duplicateX: 'Zduplikowane wartości X niedozwolone', rangeError: 'X docelowe poza zakresem splajnu', demoData: 'Dane Demo', custom: 'Niestandardowy', methodUsed: 'Użyta Metoda', loadExample: 'Załaduj Dane Przykładowe' },
  id: { title: 'Kalkulator Interpolasi', subtitle: 'Estimasikan nilai antara titik data yang diketahui', method: 'Metode', targetX: 'Nilai X Target', calculate: 'Interpolasi', addPoint: 'Tambah Titik', remove: 'Hapus', result: 'Hasil', steps: 'Langkah', interpolatedValue: 'Nilai Interpolasi', dataPoints: 'Titik Data', invalid: 'Masukkan angka yang valid', minPoints: 'Minimal 2 titik diperlukan', maxPoints: 'Maksimum 5 titik untuk Lagrange', duplicateX: 'Nilai X ganda tidak diizinkan', rangeError: 'X target di luar rentang spline', demoData: 'Data Demo', custom: 'Kustom', methodUsed: 'Metode yang Digunakan', loadExample: 'Muat Data Contoh' },
  bg: { title: 'Калкулатор за Интерполация', subtitle: 'Оценете стойности между известни точки', method: 'Метод', targetX: 'Целева X Стойност', calculate: 'Интерполирай', addPoint: 'Добави Точка', remove: 'Премахни', result: 'Резултат', steps: 'Стъпки', interpolatedValue: 'Интерполирана Стойност', dataPoints: 'Точки Данни', invalid: 'Въведете валидни числа', minPoints: 'Необходими са поне 2 точки', maxPoints: 'Максимум 5 точки за Лагранж', duplicateX: 'Дублиращи X стойности не са позволени', rangeError: 'Целева X извън обхвата на сплайна', demoData: 'Демо Данни', custom: 'Персонализиран', methodUsed: 'Използван Метод', loadExample: 'Зареди Примерни Данни' },
  tr: { title: 'İnterpolasyon Hesaplayıcısı', subtitle: 'Bilinen veri noktaları arasındaki değerleri tahmin edin', method: 'Yöntem', targetX: 'Hedef X Değeri', calculate: 'İnterpole Et', addPoint: 'Nokta Ekle', remove: 'Kaldır', result: 'Sonuç', steps: 'Adımlar', interpolatedValue: 'İnterpole Edilen Değer', dataPoints: 'Veri Noktaları', invalid: 'Geçerli sayılar girin', minPoints: 'En az 2 veri noktası gerekli', maxPoints: 'Lagrange için maksimum 5 nokta', duplicateX: 'Yinelenen X değerlerine izin verilmez', rangeError: 'Hedef X spline aralığı dışında', demoData: 'Demo Verileri', custom: 'Özel', methodUsed: 'Kullanılan Yöntem', loadExample: 'Örnek Veri Yükle' },
  sv: { title: 'Interpolationskalkylator', subtitle: 'Beräkna värden mellan kända datapunkter', method: 'Metod', targetX: 'Målvärde X', calculate: 'Interpolera', addPoint: 'Lägg Till Punkt', remove: 'Ta Bort', result: 'Resultat', steps: 'Steg', interpolatedValue: 'Interpolerat Värde', dataPoints: 'Datapunkter', invalid: 'Ange giltiga siffror', minPoints: 'Minst 2 datapunkter krävs', maxPoints: 'Max 5 punkter för Lagrange', duplicateX: 'Dubbletta X-värden ej tillåtna', rangeError: 'Målvärde X utanför spline-intervall', demoData: 'Demodata', custom: 'Anpassad', methodUsed: 'Använd Metod', loadExample: 'Ladda Exempeldata' },
};

function L(key: string, locale: string): string {
  const l = locale || 'en';
  return ui[l]?.[key] ?? ui.en[key] ?? key;
}

export default function InterpolationCalculator({ locale = 'en', showChart = true }: Props) {
  const [inputRows, setInputRows] = useState<{ x: string; y: string }[]>(demoDatasets.temperature.rows);
  const [method, setMethod] = useState<InterpMethod>('linear');
  const [targetX, setTargetX] = useState<string>(demoDatasets.temperature.targetX);
  const [result, setResult] = useState<InterpolationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [activeDataset, setActiveDataset] = useState<string>('temperature');
  const chartRef = useRef<HTMLCanvasElement | null>(null);

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

  const loadDataset = (key: string) => {
    const ds = demoDatasets[key];
    if (ds) {
      setInputRows([...ds.rows]);
      setTargetX(ds.targetX);
      setActiveDataset(key);
      setResult(null);
      setError('');
    }
  };

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
    setActiveDataset('custom');
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

  const handleExportCSV = () => {
    const validPoints = inputRows
      .map((r) => ({ x: Number(r.x), y: Number(r.y) }))
      .filter((p) => !isNaN(p.x) && !isNaN(p.y));
    const content = exportToCSV(validPoints);
    downloadCSV(content, 'interpolation-result.csv');
  };

  const handleExportPNG = () => downloadPNG(chartRef.current, 'interpolation-chart.png');

  return (
    <div className="calculator-card p-6 md:p-10 max-w-5xl mx-auto" role="application" aria-label={L('title', locale)}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{L('demoData', locale)}</span>
          <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-700 to-transparent" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(demoDatasets).filter(([k]) => k !== 'custom').map(([key, ds]) => (
            <button key={key} onClick={() => loadDataset(key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeDataset === key ? 'bg-gold-600 text-white shadow-md shadow-gold-500/20' : 'bg-white/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700/80 border border-neutral-200/60 dark:border-neutral-700/60'}`}>
              {getDemoLabel(key, locale)}
            </button>
          ))}
          <button onClick={() => loadDataset('custom')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeDataset === 'custom' ? 'bg-gold-700 text-white shadow-md shadow-gold-500/20' : 'bg-white/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700/80 border border-neutral-200/60 dark:border-neutral-700/60'}`}>
            {L('custom', locale)}
          </button>
        </div>
        {activeDataset !== 'custom' && <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2 italic">{demoDatasets[activeDataset]?.context}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 calculator-inputs">
        <div>
          <label htmlFor="interp-target-x" className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">{L('targetX', locale)}</label>
          <input id="interp-target-x" type="number" step="any" value={targetX} onChange={(e) => setTargetX(e.target.value)} className="input-field dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600" aria-label={L('targetX', locale)} />
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{L('dataPoints', locale)}</span>
            <span className="num-badge">{inputRows.length}</span>
          </div>
          <button onClick={addRow} className="btn-secondary" aria-label={L('addPoint', locale)}>
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
                    className="input-field py-2 w-full dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600"
                    aria-label={`Point ${i + 1} X`}
                    placeholder="X"
                  />
                </div>
                <div className="w-full px-4 md:pl-6">
                  <input
                    type="number"
                    step="any"
                    value={row.y}
                    onChange={(e) => updateRow(i, 'y', e.target.value)}
                    className="input-field py-2 w-full dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600"
                    aria-label={`Point ${i + 1} Y`}
                    placeholder="Y"
                  />
                </div>
                <button onClick={() => removeRow(i)} disabled={inputRows.length <= 2} className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 self-end md:self-center">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleCalculate} className="w-full py-5 px-10 rounded-2xl font-bold text-xl text-white tracking-wide bg-gradient-to-r from-gold-700 via-gold-500 to-gold-400 shadow-xl shadow-gold-500/30 hover:shadow-2xl hover:shadow-gold-500/50 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:outline-none border border-white/10 dark:border-gold-500/30 mb-2 relative overflow-hidden group" aria-label={L('calculate', locale)}>
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{animation: 'shimmer 2s infinite'}} />
        <span className="relative z-10">{L('calculate', locale)}</span>
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200/60 dark:border-red-700/60 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-center gap-2 animate-fade-in-up backdrop-blur-sm" role="alert">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{L('result', locale)}</span>
            <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-700 to-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="result-card-accent">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">{L('interpolatedValue', locale)}</p>
              <p className="text-2xl font-bold text-gold-600 dark:text-gold-400 font-serif">{result.value.toFixed(6)}</p>
            </div>
            <div className="result-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">{L('methodUsed', locale)}</p>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{result.method}</p>
            </div>
          </div>
          <div className="result-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-3">{L('steps', locale)}</p>
            <ol className="space-y-2">
              {result.steps.map((step, i) => (
                <li key={i} className="step-item">
                  <span className="num-badge flex-shrink-0 scale-90">{i + 1}</span>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {showChart && (
            <div className="mb-6">
              <Suspense fallback={<div className="h-64 bg-white/40 dark:bg-neutral-800/40 rounded-2xl animate-pulse flex items-center justify-center text-neutral-400 backdrop-blur-sm border border-neutral-200/40 dark:border-neutral-700/40">Loading chart...</div>}>
                <InterpolationChart
                  points={inputRows.map((r) => ({ x: Number(r.x), y: Number(r.y) })).filter((p) => !isNaN(p.x) && !isNaN(p.y))}
                  interpolatedX={Number(targetX) || 0}
                  interpolatedY={result.value}
                  method={method}
                  ref={chartRef}
                />
              </Suspense>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button onClick={handleExportCSV} className="btn-export-csv" aria-label="Export CSV">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              CSV
            </button>
            <button onClick={handleExportPNG} className="btn-export-png" aria-label="Export PNG">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
