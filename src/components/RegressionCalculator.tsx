import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { simpleRegression, multipleRegression } from '../utils/regression';
import type { RegressionResult } from '../utils/regression';
import { sanitizeInput, debounce, exportToCSV, downloadCSV, downloadPNG } from '../utils/validation';

const RegressionChart = lazy(() => import('./RegressionChart'));

type RegMethod = 'simple' | 'multiple';

interface Props {
  locale?: string;
  showChart?: boolean;
}

const methodLabels: Record<RegMethod, Record<string, string>> = {
  simple: { en: 'Simple Regression', hi: 'सरल प्रतिगमन', es: 'Regresión Simple', ru: 'Простая Регрессия', fr: 'Régression Simple', de: 'Einfache Regression', it: 'Regressione Semplice', pt: 'Regressão Simples', bn: 'সরল নির্ভরণ', ja: '単回帰', ko: '단순 회귀', ms: 'Regresi Ringkas', pl: 'Regresja Prosta', id: 'Regresi Sederhana', ar: 'انحدار بسيط', bg: 'Проста Регресия', tr: 'Basit Regresyon', sv: 'Enkel Regression' },
  multiple: { en: 'Multiple Regression', hi: 'बहु प्रतिगमन', es: 'Regresión Múltiple', ru: 'Множественная Регрессия', fr: 'Régression Multiple', de: 'Mehrfache Regression', it: 'Regressione Multipla', pt: 'Regressão Múltipla', bn: 'বহু নির্ভরণ', ja: '重回帰', ko: '다중 회귀', ms: 'Regresi Berganda', pl: 'Regresja Wielokrotna', id: 'Regresi Berganda', ar: 'انحدار متعدد', bg: 'Множествена Регресия', tr: 'Çoklu Regresyon', sv: 'Multipel Regression' },
};

const simpleDemoSets: Record<string, { label: string; rows: { x: string; y: string }[]; predictX: string; context: string }> = {
  house: {
    label: 'House Prices',
    context: 'Square footage (100s) → Price ($1000s)',
    rows: [
      { x: '10', y: '150' }, { x: '12', y: '180' }, { x: '15', y: '220' },
      { x: '18', y: '260' }, { x: '20', y: '290' }, { x: '25', y: '350' },
    ],
    predictX: '22',
  },
  advertising: {
    label: 'Ad Spend vs Sales',
    context: 'Ad spend ($K) → Sales ($K)',
    rows: [
      { x: '5', y: '40' }, { x: '8', y: '52' }, { x: '10', y: '62' },
      { x: '12', y: '75' }, { x: '15', y: '88' }, { x: '18', y: '105' },
    ],
    predictX: '16',
  },
  study: {
    label: 'Study Hours vs Score',
    context: 'Study hours → Test score (%)',
    rows: [
      { x: '2', y: '55' }, { x: '4', y: '62' }, { x: '6', y: '71' },
      { x: '8', y: '78' }, { x: '10', y: '85' }, { x: '12', y: '92' },
    ],
    predictX: '9',
  },
  custom: {
    label: 'Custom',
    context: 'Enter your own data',
    rows: [{ x: '1', y: '2.1' }, { x: '2', y: '3.9' }, { x: '3', y: '6.2' }, { x: '4', y: '7.8' }, { x: '5', y: '10.1' }],
    predictX: '6',
  },
};

const multiDemoSets: Record<string, { label: string; rows: { x1: string; x2: string; y: string }[]; predictX1: string; predictX2: string; context: string }> = {
  sales: {
    label: 'Product Sales',
    context: 'TV Ads ($K), Radio Ads ($K) → Sales ($K)',
    rows: [
      { x1: '2', x2: '1', y: '12' }, { x1: '3', x2: '2', y: '18' }, { x1: '4', x2: '1', y: '20' },
      { x1: '5', x2: '3', y: '28' }, { x1: '6', x2: '2', y: '30' }, { x1: '7', x2: '4', y: '38' },
    ],
    predictX1: '6',
    predictX2: '3',
  },
  realEstate: {
    label: 'Real Estate',
    context: 'Size (1000 sqft), Age (years) → Price ($100K)',
    rows: [
      { x1: '15', x2: '5', y: '25' }, { x1: '20', x2: '3', y: '35' }, { x1: '18', x2: '8', y: '28' },
      { x1: '25', x2: '2', y: '42' }, { x1: '22', x2: '6', y: '34' }, { x1: '30', x2: '1', y: '55' },
    ],
    predictX1: '24',
    predictX2: '4',
  },
  custom: {
    label: 'Custom',
    context: 'Enter your own data',
    rows: [
      { x1: '1', x2: '2', y: '5' }, { x1: '2', x2: '3', y: '8' }, { x1: '3', x2: '1', y: '7' },
      { x1: '4', x2: '4', y: '12' }, { x1: '5', x2: '2', y: '10' },
    ],
    predictX1: '6',
    predictX2: '3',
  },
};

const ui: Record<string, Record<string, string>> = {
  en: { title: 'Regression Calculator', subtitle: 'Analyze relationships between variables', method: 'Method', predictX: 'Predict at X', predictX1: 'Predict at X₁', predictX2: 'Predict at X₂', calculate: 'Calculate', addPoint: 'Add Point', remove: 'Remove', result: 'Result', equation: 'Equation', rSquared: 'R² Score', predictedValue: 'Predicted Value', steps: 'Steps', dataPoints: 'Data Points', invalid: 'Please enter valid numbers', minPoints: 'At least 2 data points required for simple, 3 for multiple', singularMatrix: 'Singular matrix: variables may be collinear', demoData: 'Demo Data', custom: 'Custom', coefficients: 'Coefficients', loadExample: 'Load Example Data' },
  es: { title: 'Calculadora de Regresión', subtitle: 'Analiza relaciones entre variables', method: 'Método', predictX: 'Predecir en X', predictX1: 'Predecir en X₁', predictX2: 'Predecir en X₂', calculate: 'Calcular', addPoint: 'Agregar Punto', remove: 'Eliminar', result: 'Resultado', equation: 'Ecuación', rSquared: 'Puntuación R²', predictedValue: 'Valor Predicho', steps: 'Pasos', dataPoints: 'Puntos de Datos', invalid: 'Ingrese números válidos', minPoints: 'Al menos 2 puntos para simple, 3 para múltiple', singularMatrix: 'Matriz singular: variables pueden ser colineales', demoData: 'Datos Demo', custom: 'Personalizado', coefficients: 'Coeficientes', loadExample: 'Cargar Datos de Ejemplo' },
  fr: { title: 'Calculateur de Régression', subtitle: 'Analysez les relations entre les variables', method: 'Méthode', predictX: 'Prédire à X', predictX1: 'Prédire à X₁', predictX2: 'Prédire à X₂', calculate: 'Calculer', addPoint: 'Ajouter un Point', remove: 'Supprimer', result: 'Résultat', equation: 'Équation', rSquared: 'Score R²', predictedValue: 'Valeur Prédite', steps: 'Étapes', dataPoints: 'Points de Données', invalid: 'Entrez des nombres valides', minPoints: 'Au moins 2 points pour simple, 3 pour multiple', singularMatrix: 'Matrice singulière: variables colinéaires', demoData: 'Données Démo', custom: 'Personnalisé', coefficients: 'Coefficients', loadExample: 'Charger les Données d\'exemple' },
  de: { title: 'Regressionsrechner', subtitle: 'Analysieren Sie Beziehungen zwischen Variablen', method: 'Methode', predictX: 'Vorhersage bei X', predictX1: 'Vorhersage bei X₁', predictX2: 'Vorhersage bei X₂', calculate: 'Berechnen', addPoint: 'Punkt Hinzufügen', remove: 'Entfernen', result: 'Ergebnis', equation: 'Gleichung', rSquared: 'R²-Wert', predictedValue: 'Vorhergesagter Wert', steps: 'Schritte', dataPoints: 'Datenpunkte', invalid: 'Bitte gültige Zahlen eingeben', minPoints: 'Mindestens 2 Punkte für einfach, 3 für mehrfach', singularMatrix: 'Singuläre Matrix: Variablen kollinear', demoData: 'Demo-Daten', custom: 'Benutzerdefiniert', coefficients: 'Koeffizienten', loadExample: 'Beispieldaten Laden' },
  ja: { title: '回帰計算機', subtitle: '変数間の関係を分析', method: '手法', predictX: 'Xで予測', predictX1: 'X₁で予測', predictX2: 'X₂で予測', calculate: '計算', addPoint: 'ポイント追加', remove: '削除', result: '結果', equation: '方程式', rSquared: 'R²スコア', predictedValue: '予測値', steps: '手順', dataPoints: 'データポイント', invalid: '有効な数値を入力してください', minPoints: '単回帰は2点以上、重回帰は3点以上必要', singularMatrix: '特異行列: 変数が共線性の可能性', demoData: 'デモデータ', custom: 'カスタム', coefficients: '係数', loadExample: 'サンプルデータを読み込む' },
  ko: { title: '회귀 계산기', subtitle: '변수 간의 관계 분석', method: '방법', predictX: 'X에서 예측', predictX1: 'X₁에서 예측', predictX2: 'X₂에서 예측', calculate: '계산', addPoint: '포인트 추가', remove: '삭제', result: '결과', equation: '방정식', rSquared: 'R² 점수', predictedValue: '예측값', steps: '단계', dataPoints: '데이터 포인트', invalid: '유효한 숫자를 입력하세요', minPoints: '단순회귀 2개 이상, 다중회귀 3개 이상 필요', singularMatrix: '특이 행렬: 변수가 공선형일 수 있음', demoData: '데모 데이터', custom: '사용자 정의', coefficients: '계수', loadExample: '샘플 데이터 로드' },
  ar: { title: 'حاسبة الانحدار', subtitle: 'حلل العلاقات بين المتغيرات', method: 'طريقة', predictX: 'توقع عند X', predictX1: 'توقع عند X₁', predictX2: 'توقع عند X₂', calculate: 'احسب', addPoint: 'إضافة نقطة', remove: 'إزالة', result: 'النتيجة', equation: 'المعادلة', rSquared: 'درجة R²', predictedValue: 'القيمة المتوقعة', steps: 'الخطوات', dataPoints: 'نقاط البيانات', invalid: 'أدخل أرقامًا صالحة', minPoints: 'نقطتين على الأقل للبسيط، 3 للمتعدد', singularMatrix: 'مصفوفة مفردة: المتغيرات قد تكون خطية مشتركة', demoData: 'بيانات تجريبية', custom: 'مخصص', coefficients: 'المعاملات', loadExample: 'تحميل بيانات تجريبية' },
  it: { title: 'Calcolatore di Regressione', subtitle: 'Analizza relazioni tra variabili', method: 'Metodo', predictX: 'Prevedi a X', predictX1: 'Prevedi a X₁', predictX2: 'Prevedi a X₂', calculate: 'Calcola', addPoint: 'Aggiungi Punto', remove: 'Rimuovi', result: 'Risultato', equation: 'Equazione', rSquared: 'Punteggio R²', predictedValue: 'Valore Previsto', steps: 'Passaggi', dataPoints: 'Punti Dati', invalid: 'Inserisci numeri validi', minPoints: 'Almeno 2 punti per semplice, 3 per multipla', singularMatrix: 'Matrice singolare: variabili collineari', demoData: 'Dati Demo', custom: 'Personalizzato', coefficients: 'Coefficienti', loadExample: 'Carica Dati di Esempio' },
  pt: { title: 'Calculadora de Regressão', subtitle: 'Analise relações entre variáveis', method: 'Método', predictX: 'Prever em X', predictX1: 'Prever em X₁', predictX2: 'Prever em X₂', calculate: 'Calcular', addPoint: 'Adicionar Ponto', remove: 'Remover', result: 'Resultado', equation: 'Equação', rSquared: 'Pontuação R²', predictedValue: 'Valor Previsto', steps: 'Etapas', dataPoints: 'Pontos de Dados', invalid: 'Insira números válidos', minPoints: 'Pelo menos 2 pontos para simples, 3 para múltipla', singularMatrix: 'Matriz singular: variáveis podem ser colineares', demoData: 'Dados Demo', custom: 'Personalizado', coefficients: 'Coeficientes', loadExample: 'Carregar Dados de Exemplo' },
  ru: { title: 'Калькулятор Регрессии', subtitle: 'Анализируйте зависимости между переменными', method: 'Метод', predictX: 'Прогноз при X', predictX1: 'Прогноз при X₁', predictX2: 'Прогноз при X₂', calculate: 'Вычислить', addPoint: 'Добавить Точку', remove: 'Удалить', result: 'Результат', equation: 'Уравнение', rSquared: 'Оценка R²', predictedValue: 'Прогнозируемое Значение', steps: 'Шаги', dataPoints: 'Точки Данных', invalid: 'Введите корректные числа', minPoints: 'Минимум 2 точки для простой, 3 для множественной', singularMatrix: 'Сингулярная матрица: переменные коллинеарны', demoData: 'Демо-данные', custom: 'Пользовательский', coefficients: 'Коэффициенты', loadExample: 'Загрузить Пример Данных' },
  hi: { title: 'प्रतिगमन कैलकुलेटर', subtitle: 'चरों के बीच संबंधों का विश्लेषण करें', method: 'विधि', predictX: 'X पर भविष्यवाणी', predictX1: 'X₁ पर भविष्यवाणी', predictX2: 'X₂ पर भविष्यवाणी', calculate: 'गणना करें', addPoint: 'बिंदु जोड़ें', remove: 'हटाएं', result: 'परिणाम', equation: 'समीकरण', rSquared: 'R² स्कोर', predictedValue: 'भविष्यवाणी मान', steps: 'चरण', dataPoints: 'डेटा बिंदु', invalid: 'कृपया मान्य संख्या दर्ज करें', minPoints: 'सरल के लिए 2, बहु के लिए 3 बिंदु आवश्यक', singularMatrix: 'विषम मैट्रिक्स: चर सहरेखीय हो सकते हैं', demoData: 'डेमो डेटा', custom: 'कस्टम', coefficients: 'गुणांक', loadExample: 'उदाहरण डेटा लोड करें' },
  bn: { title: 'নির্ভরণ ক্যালকুলেটর', subtitle: 'চলকের মধ্যে সম্পর্ক বিশ্লেষণ', method: 'পদ্ধতি', predictX: 'X এ পূর্বাভাস', predictX1: 'X₁ এ পূর্বাভাস', predictX2: 'X₂ এ পূর্বাভাস', calculate: 'গণনা', addPoint: 'পয়েন্ট যোগ', remove: 'সরান', result: 'ফলাফল', equation: 'সমীকরণ', rSquared: 'R² স্কোর', predictedValue: 'পূর্বাভাস মান', steps: 'ধাপ', dataPoints: 'ডেটা পয়েন্ট', invalid: 'বৈধ সংখ্যা দিন', minPoints: 'সরলে ২, বহুতে ৩ পয়েন্ট প্রয়োজন', singularMatrix: 'একক ম্যাট্রিক্স: চলক সমরেখীয় হতে পারে', demoData: 'ডেমো ডেটা', custom: 'কাস্টম', coefficients: 'সহগ', loadExample: 'উদাহরণ ডেটা লোড করুন' },
  ms: { title: 'Kalkulator Regresi', subtitle: 'Analisis hubungan antara pembolehubah', method: 'Kaedah', predictX: 'Ramal pada X', predictX1: 'Ramal pada X₁', predictX2: 'Ramal pada X₂', calculate: 'Kira', addPoint: 'Tambah Titik', remove: 'Buang', result: 'Keputusan', equation: 'Persamaan', rSquared: 'Skor R²', predictedValue: 'Nilai Ramalan', steps: 'Langkah', dataPoints: 'Titik Data', invalid: 'Sila masukkan nombor yang sah', minPoints: 'Sekurang-kurangnya 2 titik untuk ringkas, 3 untuk berganda', singularMatrix: 'Matriks singular: pembolehubah mungkin kolinear', demoData: 'Data Demo', custom: 'Tersuai', coefficients: 'Pekali', loadExample: 'Muat Data Contoh' },
  pl: { title: 'Kalkulator Regresji', subtitle: 'Analizuj relacje między zmiennymi', method: 'Metoda', predictX: 'Przewiduj przy X', predictX1: 'Przewiduj przy X₁', predictX2: 'Przewiduj przy X₂', calculate: 'Oblicz', addPoint: 'Dodaj Punkt', remove: 'Usuń', result: 'Wynik', equation: 'Równanie', rSquared: 'Wynik R²', predictedValue: 'Wartość Przewidywana', steps: 'Kroki', dataPoints: 'Punkty Danych', invalid: 'Podaj prawidłowe liczby', minPoints: 'Minimum 2 punkty dla prostej, 3 dla wielokrotnej', singularMatrix: 'Macierz osobliwa: zmienne współliniowe', demoData: 'Dane Demo', custom: 'Niestandardowy', coefficients: 'Współczynniki', loadExample: 'Załaduj Dane Przykładowe' },
  id: { title: 'Kalkulator Regresi', subtitle: 'Analisis hubungan antar variabel', method: 'Metode', predictX: 'Prediksi pada X', predictX1: 'Prediksi pada X₁', predictX2: 'Prediksi pada X₂', calculate: 'Hitung', addPoint: 'Tambah Titik', remove: 'Hapus', result: 'Hasil', equation: 'Persamaan', rSquared: 'Skor R²', predictedValue: 'Nilai Prediksi', steps: 'Langkah', dataPoints: 'Titik Data', invalid: 'Masukkan angka yang valid', minPoints: 'Minimal 2 titik untuk sederhana, 3 untuk berganda', singularMatrix: 'Matriks singular: variabel mungkin kolinear', demoData: 'Data Demo', custom: 'Kustom', coefficients: 'Koefisien', loadExample: 'Muat Data Contoh' },
  bg: { title: 'Калкулатор за Регресия', subtitle: 'Анализирайте връзки между променливи', method: 'Метод', predictX: 'Прогноза при X', predictX1: 'Прогноза при X₁', predictX2: 'Прогноза при X₂', calculate: 'Изчисли', addPoint: 'Добави Точка', remove: 'Премахни', result: 'Резултат', equation: 'Уравнение', rSquared: 'R² Резултат', predictedValue: 'Прогнозирана Стойност', steps: 'Стъпки', dataPoints: 'Точки Данни', invalid: 'Въведете валидни числа', minPoints: 'Минимум 2 точки за проста, 3 за множествена', singularMatrix: 'Сингулярна матрица: променливите може да са колинеарни', demoData: 'Демо Данни', custom: 'Персонализиран', coefficients: 'Коефициенти', loadExample: 'Зареди Примерни Данни' },
  tr: { title: 'Regresyon Hesaplayıcısı', subtitle: 'Değişkenler arasındaki ilişkileri analiz edin', method: 'Yöntem', predictX: 'X\'te Tahmin', predictX1: 'X₁\'de Tahmin', predictX2: 'X₂\'de Tahmin', calculate: 'Hesapla', addPoint: 'Nokta Ekle', remove: 'Kaldır', result: 'Sonuç', equation: 'Denklem', rSquared: 'R² Skoru', predictedValue: 'Tahmin Edilen Değer', steps: 'Adımlar', dataPoints: 'Veri Noktaları', invalid: 'Geçerli sayılar girin', minPoints: 'Basit için en az 2, çoklu için 3 nokta gerekli', singularMatrix: 'Tekil matris: değişkenler eşdoğrusal olabilir', demoData: 'Demo Verileri', custom: 'Özel', coefficients: 'Katsayılar', loadExample: 'Örnek Veri Yükle' },
  sv: { title: 'Regressionskalkylator', subtitle: 'Analysera samband mellan variabler', method: 'Metod', predictX: 'Förutsäg vid X', predictX1: 'Förutsäg vid X₁', predictX2: 'Förutsäg vid X₂', calculate: 'Beräkna', addPoint: 'Lägg Till Punkt', remove: 'Ta Bort', result: 'Resultat', equation: 'Ekvation', rSquared: 'R²-poäng', predictedValue: 'Förutsagt Värde', steps: 'Steg', dataPoints: 'Datapunkter', invalid: 'Ange giltiga siffror', minPoints: 'Minst 2 punkter för enkel, 3 för multipel', singularMatrix: 'Singulär matris: variabler kan vara kollinjära', demoData: 'Demodata', custom: 'Anpassad', coefficients: 'Koefficienter', loadExample: 'Ladda Exempeldata' },
};

const simpleDemoLabels: Record<string, Record<string, string>> = {
  en: { house: 'House Prices', advertising: 'Ad Spend vs Sales', study: 'Study Hours vs Score', custom: 'Custom' },
  hi: { house: 'घर की कीमतें', advertising: 'विज्ञापन खर्च बनाम बिक्री', study: 'अध्ययन घंटे बनाम स्कोर', custom: 'कस्टम' },
  es: { house: 'Precios de Viviendas', advertising: 'Gasto en Publicidad vs Ventas', study: 'Horas de Estudio vs Calificación', custom: 'Personalizado' },
  ru: { house: 'Цены на Дома', advertising: 'Расходы на Рекламу vs Продажи', study: 'Часы Учёбы vs Оценка', custom: 'Пользовательский' },
  fr: { house: 'Prix Immobilier', advertising: 'Dépenses Pub vs Ventes', study: 'Heures d\'étude vs Note', custom: 'Personnalisé' },
  de: { house: 'Hauspreise', advertising: 'Werbeausgaben vs Umsatz', study: 'Lernstunden vs Note', custom: 'Benutzerdefiniert' },
  it: { house: 'Prezzi delle Case', advertising: 'Spesa Pubblicitaria vs Vendite', study: 'Ore di Studio vs Voto', custom: 'Personalizzato' },
  pt: { house: 'Preços de Casas', advertising: 'Gasto Publicitário vs Vendas', study: 'Horas de Estudo vs Nota', custom: 'Personalizado' },
  bn: { house: 'বাড়ির দাম', advertising: 'বিজ্ঞাপন খরচ বনাম বিক্রয়', study: 'পড়ার ঘন্টা বনাম স্কোর', custom: 'কাস্টম' },
  ja: { house: '住宅価格', advertising: '広告費 vs 売上', study: '学習時間 vs 点数', custom: 'カスタム' },
  ko: { house: '주택 가격', advertising: '광고비 vs 매출', study: '학습 시간 vs 점수', custom: '사용자 정의' },
  ms: { house: 'Harga Rumah', advertising: 'Perbelanjaan Iklan vs Jualan', study: 'Jam Belajar vs Skor', custom: 'Tersuai' },
  pl: { house: 'Ceny Nieruchomości', advertising: 'Wydatki na Reklamę vs Sprzedaż', study: 'Godziny Nauki vs Wynik', custom: 'Niestandardowy' },
  id: { house: 'Harga Rumah', advertising: 'Pengeluaran Iklan vs Penjualan', study: 'Jam Belajar vs Skor', custom: 'Kustom' },
  ar: { house: 'أسعار المنازل', advertising: 'الإنفاق الإعلاني مقابل المبيعات', study: 'ساعات الدراسة مقابل الدرجة', custom: 'مخصص' },
  bg: { house: 'Цени на Къщи', advertising: 'Разходи за Реклама vs Продажби', study: 'Часове Учене vs Оценка', custom: 'Персонализиран' },
  tr: { house: 'Ev Fiyatları', advertising: 'Reklam Harcaması vs Satışlar', study: 'Çalışma Saatleri vs Puan', custom: 'Özel' },
  sv: { house: 'Huspriser', advertising: 'Reklamkostnad vs Försäljning', study: 'Studietimmar vs Betyg', custom: 'Anpassad' },
};

const multiDemoLabels: Record<string, Record<string, string>> = {
  en: { sales: 'Product Sales', realEstate: 'Real Estate', custom: 'Custom' },
  hi: { sales: 'उत्पाद बिक्री', realEstate: 'रियल एस्टेट', custom: 'कस्टम' },
  es: { sales: 'Ventas de Productos', realEstate: 'Bienes Raíces', custom: 'Personalizado' },
  ru: { sales: 'Продажи Товаров', realEstate: 'Недвижимость', custom: 'Пользовательский' },
  fr: { sales: 'Ventes de Produits', realEstate: 'Immobilier', custom: 'Personnalisé' },
  de: { sales: 'Produktverkäufe', realEstate: 'Grundstücke', custom: 'Benutzerdefiniert' },
  it: { sales: 'Vendite Prodotti', realEstate: 'Immobiliare', custom: 'Personalizzato' },
  pt: { sales: 'Vendas de Produtos', realEstate: 'Imobiliário', custom: 'Personalizado' },
  bn: { sales: 'পণ্য বিক্রয়', realEstate: 'রিয়েল এস্টেট', custom: 'কাস্টম' },
  ja: { sales: '製品売上', realEstate: '不動産', custom: 'カスタム' },
  ko: { sales: '제품 매출', realEstate: '부동산', custom: '사용자 정의' },
  ms: { sales: 'Jualan Produk', realEstate: 'Hartanah', custom: 'Tersuai' },
  pl: { sales: 'Sprzedaż Produktów', realEstate: 'Nieruchomości', custom: 'Niestandardowy' },
  id: { sales: 'Penjualan Produk', realEstate: 'Properti', custom: 'Kustom' },
  ar: { sales: 'مبيعات المنتجات', realEstate: 'عقارات', custom: 'مخصص' },
  bg: { sales: 'Продажби на Продукти', realEstate: 'Недвижими Имоти', custom: 'Персонализиран' },
  tr: { sales: 'Ürün Satışları', realEstate: 'Gayrimenkul', custom: 'Özel' },
  sv: { sales: 'Produktförsäljning', realEstate: 'Fastigheter', custom: 'Anpassad' },
};

function getDemoLabel(key: string, locale: string, type: 'simple' | 'multi'): string {
  const labels = type === 'simple' ? simpleDemoLabels : multiDemoLabels;
  return labels[locale]?.[key] ?? labels.en[key] ?? key;
}

function L(key: string, locale: string): string {
  const l = locale || 'en';
  return ui[l]?.[key] ?? ui.en[key] ?? key;
}

export default function RegressionCalculator({ locale = 'en', showChart = true }: Props) {
  const [method, setMethod] = useState<RegMethod>('simple');
  const [simpleRows, setSimpleRows] = useState<{ x: string; y: string }[]>(simpleDemoSets.house.rows);
  const [multiRows, setMultiRows] = useState<{ x1: string; x2: string; y: string }[]>(multiDemoSets.sales.rows);
  const [predictX, setPredictX] = useState<string>(simpleDemoSets.house.predictX);
  const [predictX1, setPredictX1] = useState<string>(multiDemoSets.sales.predictX1);
  const [predictX2, setPredictX2] = useState<string>(multiDemoSets.sales.predictX2);
  const [result, setResult] = useState<RegressionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [activeSimpleSet, setActiveSimpleSet] = useState<string>('house');
  const [activeMultiSet, setActiveMultiSet] = useState<string>('sales');
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  const calculateSimple = useCallback(() => {
    const pts = simpleRows.map(r => ({ x: Number(r.x), y: Number(r.y) })).filter(p => !isNaN(p.x) && !isNaN(p.y));
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
    const pts = multiRows.map(r => ({ x1: Number(r.x1), x2: Number(r.x2), y: Number(r.y) })).filter(p => !isNaN(p.x1) && !isNaN(p.x2) && !isNaN(p.y));
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

  const loadSimpleDataset = (key: string) => {
    const ds = simpleDemoSets[key];
    if (ds) { setSimpleRows([...ds.rows]); setPredictX(ds.predictX); setActiveSimpleSet(key); setResult(null); setError(''); }
  };
  const loadMultiDataset = (key: string) => {
    const ds = multiDemoSets[key];
    if (ds) { setMultiRows([...ds.rows]); setPredictX1(ds.predictX1); setPredictX2(ds.predictX2); setActiveMultiSet(key); setResult(null); setError(''); }
  };

  const addSimpleRow = () => setSimpleRows([...simpleRows, { x: '', y: '' }]);
  const removeSimpleRow = (i: number) => { if (simpleRows.length <= 2) return; setSimpleRows(simpleRows.filter((_, idx) => idx !== i)); };
  const updateSimpleRow = (i: number, field: 'x' | 'y', val: string) => { const n = [...simpleRows]; n[i] = { ...n[i], [field]: sanitizeInput(val) }; setSimpleRows(n); setActiveSimpleSet('custom'); };

  const addMultiRow = () => setMultiRows([...multiRows, { x1: '', x2: '', y: '' }]);
  const removeMultiRow = (i: number) => { if (multiRows.length <= 2) return; setMultiRows(multiRows.filter((_, idx) => idx !== i)); };
  const updateMultiRow = (i: number, field: 'x1' | 'x2' | 'y', val: string) => { const n = [...multiRows]; n[i] = { ...n[i], [field]: sanitizeInput(val) }; setMultiRows(n); setActiveMultiSet('custom'); };

  return (
    <div className="calculator-card p-6 md:p-10 max-w-5xl mx-auto" role="application" aria-label={L('title', locale)}>
      <div className="flex gap-2 mb-8 flex-wrap justify-center">
        {(['simple', 'multiple'] as RegMethod[]).map((m) => (
          <button key={m} onClick={() => { setMethod(m); setResult(null); setError(''); }}
            className={method === m ? 'btn-tab-active' : 'btn-tab-inactive'} aria-pressed={method === m}>
            {methodLabels[m][locale] ?? methodLabels[m].en}
          </button>
        ))}
      </div>

      {method === 'simple' ? (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{L('loadExample', locale)}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-700 to-transparent" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(simpleDemoSets).filter(([k]) => k !== 'custom').map(([key, ds]) => (
                <button key={key} onClick={() => loadSimpleDataset(key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeSimpleSet === key ? 'bg-gold-600 text-white shadow-md shadow-gold-500/20' : 'bg-white/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700/80 border border-neutral-200/60 dark:border-neutral-700/60'}`}>{getDemoLabel(key, locale, 'simple')}</button>
              ))}
              <button onClick={() => loadSimpleDataset('custom')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeSimpleSet === 'custom' ? 'bg-gold-700 text-white shadow-md shadow-gold-500/20' : 'bg-white/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700/80 border border-neutral-200/60 dark:border-neutral-700/60'}`}>{L('custom', locale)}</button>
            </div>
            {activeSimpleSet !== 'custom' && <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2 italic">{simpleDemoSets[activeSimpleSet]?.context}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="reg-predict-x" className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">{L('predictX', locale)}</label>
            <input id="reg-predict-x" type="number" step="any" value={predictX} onChange={(e) => setPredictX(e.target.value)} className="input-field dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600" />
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{L('dataPoints', locale)}</span>
                <span className="num-badge">{simpleRows.length}</span>
              </div>
              <button onClick={addSimpleRow} className="btn-secondary">{L('addPoint', locale)}</button>
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
                {simpleRows.map((row, i) => (
                  <div key={i} className="flex flex-col md:grid gap-4 md:gap-6 items-start md:items-center px-2 py-3 rounded-xl transition-all duration-200 hover:bg-white/60 dark:hover:bg-neutral-800/40" style={{ gridTemplateColumns: '40px 1fr 1fr 44px' }}>
                    <span className="num-badge text-xs scale-90 self-start md:self-center">{i + 1}</span>
                    <div className="w-full md:border-r-2 md:border-gold-500/20 md:pr-6 px-4">
                      <input type="number" step="any" value={row.x} onChange={(e) => updateSimpleRow(i, 'x', e.target.value)} className="input-field py-2 w-full dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600" aria-label={`Point ${i + 1} X`} placeholder="X" />
                    </div>
                    <div className="w-full px-4 md:pl-6">
                      <input type="number" step="any" value={row.y} onChange={(e) => updateSimpleRow(i, 'y', e.target.value)} className="input-field py-2 w-full dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600" aria-label={`Point ${i + 1} Y`} placeholder="Y" />
                    </div>
                    <button onClick={() => removeSimpleRow(i)} disabled={simpleRows.length <= 2} className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 self-end md:self-center">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={calculateSimple} className="btn-calculate mb-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            {L('calculate', locale)}
          </button>
        </>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{L('loadExample', locale)}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-700 to-transparent" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(multiDemoSets).filter(([k]) => k !== 'custom').map(([key, ds]) => (
                <button key={key} onClick={() => loadMultiDataset(key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeMultiSet === key ? 'bg-gold-600 text-white shadow-md shadow-gold-500/20' : 'bg-white/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700/80 border border-neutral-200/60 dark:border-neutral-700/60'}`}>{getDemoLabel(key, locale, 'multi')}</button>
              ))}
              <button onClick={() => loadMultiDataset('custom')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeMultiSet === 'custom' ? 'bg-gold-700 text-white shadow-md shadow-gold-500/20' : 'bg-white/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700/80 border border-neutral-200/60 dark:border-neutral-700/60'}`}>{L('custom', locale)}</button>
            </div>
            {activeMultiSet !== 'custom' && <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2 italic">{multiDemoSets[activeMultiSet]?.context}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 calculator-inputs">
            <div>
              <label htmlFor="reg-predict-x1" className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">{L('predictX1', locale)}</label>
              <input id="reg-predict-x1" type="number" step="any" value={predictX1} onChange={(e) => setPredictX1(e.target.value)} className="input-field dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600" />
            </div>
            <div>
              <label htmlFor="reg-predict-x2" className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">{L('predictX2', locale)}</label>
              <input id="reg-predict-x2" type="number" step="any" value={predictX2} onChange={(e) => setPredictX2(e.target.value)} className="input-field dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600" />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{L('dataPoints', locale)}</span>
                <span className="num-badge">{multiRows.length}</span>
              </div>
              <button onClick={addMultiRow} className="btn-secondary">{L('addPoint', locale)}</button>
            </div>
            <div className="bg-white/50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 overflow-hidden backdrop-blur-sm">
              {/* Desktop header */}
              <div className="hidden md:grid data-table-header px-4 py-3 bg-neutral-100/70 dark:bg-neutral-800/70 border-b border-neutral-200/60 dark:border-neutral-700/60 backdrop-blur-sm" style={{ gridTemplateColumns: '36px 1fr 1fr 1fr 44px' }}>
                <span className="text-center">#</span>
                <span className="px-4">X₁</span>
                <span className="px-4">X₂</span>
                <span className="px-4">Y</span>
                <span></span>
              </div>
              {/* Mobile header */}
              <div className="md:hidden px-4 py-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-neutral-200/60 dark:border-neutral-700/60">
                {L('dataPoints', locale)}
              </div>
              <div className="p-2 space-y-1">
                {multiRows.map((row, i) => (
                  <div key={i} className="flex flex-col md:grid gap-4 md:gap-6 items-start md:items-center px-2 py-3 rounded-xl transition-all duration-200 hover:bg-white/60 dark:hover:bg-neutral-800/40" style={{ gridTemplateColumns: '36px 1fr 1fr 1fr 44px' }}>
                    <span className="num-badge text-xs scale-90 self-start md:self-center">{i + 1}</span>
                    <div className="w-full md:border-r-2 md:border-gold-500/20 md:pr-6 px-4">
                      <input type="number" step="any" value={row.x1} onChange={(e) => updateMultiRow(i, 'x1', e.target.value)} className="input-field py-2 w-full dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600" aria-label={`Point ${i + 1} X1`} placeholder="X₁" />
                    </div>
                    <div className="w-full md:border-r-2 md:border-gold-500/20 md:pr-6 px-4">
                      <input type="number" step="any" value={row.x2} onChange={(e) => updateMultiRow(i, 'x2', e.target.value)} className="input-field py-2 w-full dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600" aria-label={`Point ${i + 1} X2`} placeholder="X₂" />
                    </div>
                    <div className="w-full px-4 md:pl-6">
                      <input type="number" step="any" value={row.y} onChange={(e) => updateMultiRow(i, 'y', e.target.value)} className="input-field py-2 w-full dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600" aria-label={`Point ${i + 1} Y`} placeholder="Y" />
                    </div>
                    <button onClick={() => removeMultiRow(i)} disabled={multiRows.length <= 2} className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 self-end md:self-center">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={calculateMultiple} className="btn-calculate mb-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            {L('calculate', locale)}
          </button>
        </>
      )}

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
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">{L('predictedValue', locale)}</p>
              <p className="text-2xl font-bold text-gold-600 dark:text-gold-400 font-serif">{result.predictedValue.toFixed(4)}</p>
            </div>
            <div className="result-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">{L('rSquared', locale)}</p>
              <p className="text-2xl font-bold text-gold-500">{(result.rSquared * 100).toFixed(2)}%</p>
            </div>
            <div className="result-card sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">{L('equation', locale)}</p>
              <p className="text-sm font-mono text-neutral-800 dark:text-neutral-200">{result.equation}</p>
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

          {showChart && method === 'simple' && (
            <div className="mb-6">
              <Suspense fallback={<div className="h-64 bg-white/40 dark:bg-neutral-800/40 rounded-2xl animate-pulse flex items-center justify-center text-neutral-400 backdrop-blur-sm border border-neutral-200/40 dark:border-neutral-700/40">Loading chart...</div>}>
                <RegressionChart
                  points={simpleRows.map((r) => ({ x: Number(r.x), y: Number(r.y) })).filter((p) => !isNaN(p.x) && !isNaN(p.y))}
                  result={result}
                  predictX={Number(predictX) || 0}
                  method="simple"
                  ref={chartRef}
                />
              </Suspense>
            </div>
          )}

          {method === 'simple' && (
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <button onClick={() => {
                const validPoints = simpleRows.map(r => ({ x: Number(r.x), y: Number(r.y) })).filter(p => !isNaN(p.x) && !isNaN(p.y));
                const content = exportToCSV(validPoints);
                downloadCSV(content, 'regression-result.csv');
              }} className="btn-export-csv" aria-label="Export CSV">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                CSV
              </button>
              <button onClick={() => downloadPNG(chartRef.current, 'regression-chart.png')} className="btn-export-png" aria-label="Export PNG">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                PNG
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
