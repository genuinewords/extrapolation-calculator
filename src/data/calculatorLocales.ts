export type MethodKey = 'linear' | 'exponential' | 'logarithmic' | 'polynomial' | 'quadratic';

export const methodLabels: Record<MethodKey, Record<string, string>> = {
  linear: { en: 'Linear', hi: 'रैखिक', es: 'Lineal', ru: 'Линейный', fr: 'Linéaire', de: 'Linear', it: 'Lineare', pt: 'Linear', bn: 'রৈখিক', ja: '線形', ko: '선형', ms: 'Linear', pl: 'Liniowa', id: 'Linear', ar: 'خطي', bg: 'Линеен', tr: 'Doğrusal', sv: 'Linjär' },
  exponential: { en: 'Exponential', hi: 'घातीय', es: 'Exponencial', ru: 'Экспоненциальный', fr: 'Exponentielle', de: 'Exponentiell', it: 'Esponenziale', pt: 'Exponencial', bn: 'সূক্ষ্মগণিতিক', ja: '指数', ko: '지수', ms: 'Eksponen', pl: 'Wykładnicza', id: 'Eksponensial', ar: 'أسي', bg: 'Експоненциален', tr: 'Üstel', sv: 'Exponentiell' },
  logarithmic: { en: 'Logarithmic', hi: 'लघुगणकीय', es: 'Logarítmico', ru: 'Логарифмический', fr: 'Logarithmique', de: 'Logarithmisch', it: 'Logaritmico', pt: 'Logarítmico', bn: 'লগারিদমিক', ja: '対数', ko: '로그', ms: 'Logaritma', pl: 'Logarytmiczna', id: 'Logaritmik', ar: 'لوغاريتمي', bg: 'Логаритмичен', tr: 'Logaritmik', sv: 'Logaritmisk' },
  polynomial: { en: 'Polynomial', hi: 'बहुपदीय', es: 'Polinomial', ru: 'Полиномиальный', fr: 'Polynomiale', de: 'Polynomiell', it: 'Polinomiale', pt: 'Polinomial', bn: 'বহুপদীয়', ja: '多項式', ko: '다항식', ms: 'Polinomial', pl: 'Wielomianowa', id: 'Polinomial', ar: 'كثير الحدود', bg: 'Полиномиален', tr: 'Polinomiyal', sv: 'Polynomisk' },
  quadratic: { en: 'Quadratic', hi: 'द्विघात', es: 'Cuadrático', ru: 'Квадратичный', fr: 'Quadratique', de: 'Quadratisch', it: 'Quadratico', pt: 'Quadrático', bn: 'দ্বিঘাত', ja: '二次', ko: '이차', ms: 'Kuadratik', pl: 'Kwadratowa', id: 'Kuadratik', ar: 'تربيعي', bg: 'Квадратичен', tr: 'Karesel', sv: 'Kvadratisk' },
};

export const dummyDataByMethod: Record<MethodKey, { rows: { x: string; y: string }[]; targetX: string; label: string }> = {
  linear: {
    label: 'Linear',
    rows: [
      { x: '1', y: '18.5' }, { x: '5', y: '20.2' }, { x: '10', y: '22.8' },
      { x: '15', y: '25.1' }, { x: '20', y: '27.4' },
    ],
    targetX: '30',
  },
  exponential: {
    label: 'Exponential',
    rows: [
      { x: '1', y: '100' }, { x: '2', y: '150' }, { x: '3', y: '225' },
      { x: '4', y: '337' }, { x: '5', y: '506' }, { x: '6', y: '759' },
    ],
    targetX: '8',
  },
  logarithmic: {
    label: 'Logarithmic',
    rows: [
      { x: '1', y: '15' }, { x: '3', y: '30' }, { x: '5', y: '38' },
      { x: '10', y: '48' }, { x: '20', y: '56' },
    ],
    targetX: '30',
  },
  polynomial: {
    label: 'Polynomial',
    rows: [
      { x: '1', y: '120' }, { x: '2', y: '145' }, { x: '3', y: '160' },
      { x: '4', y: '155' }, { x: '5', y: '140' }, { x: '6', y: '130' },
    ],
    targetX: '8',
  },
  quadratic: {
    label: 'Quadratic',
    rows: [
      { x: '0', y: '0' }, { x: '1', y: '15.1' }, { x: '2', y: '19.6' },
      { x: '3', y: '19.6' }, { x: '4', y: '15.1' },
    ],
    targetX: '5',
  },
};

export const demoLabels: Record<string, Record<string, string>> = {
  en: { temperature: 'Temperature Trend', sales: 'Monthly Sales', population: 'Population Growth', custom: 'Custom Data' },
  hi: { temperature: 'तापमान रुझान', sales: 'मासिक बिक्री', population: 'जनसंख्या वृद्धि', custom: 'कस्टम डेटा' },
  es: { temperature: 'Tendencia de Temperatura', sales: 'Ventas Mensuales', population: 'Crecimiento Poblacional', custom: 'Datos Personalizados' },
  ru: { temperature: 'Тенденция Температуры', sales: 'Ежемесячные Продажи', population: 'Рост Населения', custom: 'Пользовательские Данные' },
  fr: { temperature: 'Tendance de Température', sales: 'Ventes Mensuelles', population: 'Croissance Démographique', custom: 'Données Personnalisées' },
  de: { temperature: 'Temperaturtrend', sales: 'Monatlicher Umsatz', population: 'Bevölkerungswachstum', custom: 'Benutzerdefinierte Daten' },
  it: { temperature: 'Tendenza Temperatura', sales: 'Vendite Mensili', population: 'Crescita Popolazione', custom: 'Dati Personalizzati' },
  pt: { temperature: 'Tendência de Temperatura', sales: 'Vendas Mensais', population: 'Crescimento Populacional', custom: 'Dados Personalizados' },
  bn: { temperature: 'তাপমাত্রার প্রবণতা', sales: 'মাসিক বিক্রয়', population: 'জনসংখ্যা বৃদ্ধি', custom: 'কাস্টম ডেটা' },
  ja: { temperature: '気温の傾向', sales: '月間売上', population: '人口増加', custom: 'カスタムデータ' },
  ko: { temperature: '기온 추세', sales: '월간 매출', population: '인구 성장', custom: '사용자 정의 데이터' },
  ms: { temperature: 'Aliran Suhu', sales: 'Jualan Bulanan', population: 'Pertumbuhan Populasi', custom: 'Data Tersuai' },
  pl: { temperature: 'Tendencja Temperatury', sales: 'Sprzedaż Miesięczna', population: 'Wzrost Ludności', custom: 'Dane Niestandardowe' },
  id: { temperature: 'Tren Suhu', sales: 'Penjualan Bulanan', population: 'Pertumbuhan Populasi', custom: 'Data Kustom' },
  ar: { temperature: 'اتجاه الحرارة', sales: 'المبيعات الشهرية', population: 'نمو السكان', custom: 'بيانات مخصصة' },
  bg: { temperature: 'Тенденция на Температурата', sales: 'Месечни Продажби', population: 'Растеж на Населението', custom: 'Персонализирани Данни' },
  tr: { temperature: 'Sıcaklık Trendi', sales: 'Aylık Satışlar', population: 'Nüfus Artışı', custom: 'Özel Veriler' },
  sv: { temperature: 'Temperaturtrend', sales: 'Månadsförsäljning', population: 'Befolkningstillväxt', custom: 'Anpassad Data' },
};

export const demoDatasets: Record<string, { label: string; rows: { x: string; y: string }[]; targetX: string; context: string }> = {
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

export const uiLabels: Record<string, Record<string, string>> = {
  en: { title: 'Extrapolation Calculator', subtitle: 'Predict future values beyond your data range', method: 'Method', targetX: 'Target X', calculate: 'Calculate Now', addPoint: 'Add Data Point', remove: 'Remove', result: 'Result', equation: 'Equation', rSquared: 'R² Score', confidence: 'Confidence', extrapolatedValue: 'Extrapolated Value', export: 'Export', csv: 'Export CSV', png: 'Export PNG', pdf: 'Export PDF', invalid: 'Please enter valid numbers', minPoints: 'At least 2 data points required', dataPoints: 'Data Points', chartLoading: 'Loading chart...', noscript: 'JavaScript is required for the interactive calculator.', demoData: 'Demo Data', custom: 'Custom', loadExample: 'Load Example Data' },
  es: { title: 'Calculadora de Extrapolación', subtitle: 'Predice valores futuros más allá de tu rango de datos', method: 'Método', targetX: 'Valor X Objetivo', calculate: 'Calcular', addPoint: 'Agregar Punto', remove: 'Eliminar', result: 'Resultado', equation: 'Ecuación', rSquared: 'Puntuación R²', confidence: 'Confianza', extrapolatedValue: 'Valor Extrapolado', export: 'Exportar', csv: 'Exportar CSV', png: 'Exportar PNG', pdf: 'Exportar PDF', invalid: 'Ingrese números válidos', minPoints: 'Se necesitan al menos 2 puntos', dataPoints: 'Puntos de Datos', chartLoading: 'Cargando gráfico...', noscript: 'Se requiere JavaScript.', demoData: 'Datos Demo', custom: 'Personalizado', loadExample: 'Cargar Datos de Ejemplo' },
  fr: { title: "Calculateur d'Extrapolation", subtitle: 'Prédisez les valeurs futures au-delà de votre plage de données', method: 'Méthode', targetX: 'Valeur X Cible', calculate: 'Calculer', addPoint: 'Ajouter un Point', remove: 'Supprimer', result: 'Résultat', equation: 'Équation', rSquared: 'Score R²', confidence: 'Confiance', extrapolatedValue: 'Valeur Extrapolée', export: 'Exporter', csv: 'Exporter CSV', png: 'Exporter PNG', pdf: 'Exporter PDF', invalid: 'Entrez des nombres valides', minPoints: 'Au moins 2 points nécessaires', dataPoints: 'Points de Données', chartLoading: 'Chargement du graphique...', noscript: 'JavaScript est requis.', demoData: 'Données Démo', custom: 'Personnalisé', loadExample: 'Charger les Données d\'exemple' },
  de: { title: 'Extrapolationsrechner', subtitle: 'Zukünftige Werte über Ihren Datenbereich hinaus vorhersagen', method: 'Methode', targetX: 'Ziel-X-Wert', calculate: 'Berechnen', addPoint: 'Datenpunkt Hinzufügen', remove: 'Entfernen', result: 'Ergebnis', equation: 'Gleichung', rSquared: 'R²-Wert', confidence: 'Konfidenz', extrapolatedValue: 'Extrapolierter Wert', export: 'Exportieren', csv: 'CSV Exportieren', png: 'PNG Exportieren', pdf: 'PDF Exportieren', invalid: 'Bitte gültige Zahlen eingeben', minPoints: 'Mindestens 2 Datenpunkte erforderlich', dataPoints: 'Datenpunkte', chartLoading: 'Diagramm wird geladen...', noscript: 'JavaScript ist erforderlich.', demoData: 'Demo-Daten', custom: 'Benutzerdefiniert', loadExample: 'Beispieldaten Laden' },
  ja: { title: '外挿計算機', subtitle: 'データ範囲を超えて将来の値を予測', method: '手法', targetX: '目標X値', calculate: '計算', addPoint: 'データポイント追加', remove: '削除', result: '結果', equation: '方程式', rSquared: 'R²スコア', confidence: '信頼度', extrapolatedValue: '外挿値', export: 'エクスポート', csv: 'CSVエクスポート', png: 'PNGエクスポート', pdf: 'PDFエクスポート', invalid: '有効な数値を入力してください', minPoints: '2つ以上のデータポイントが必要です', dataPoints: 'データポイント', chartLoading: 'チャート読み込み中...', noscript: 'JavaScriptが必要です。', demoData: 'デモデータ', custom: 'カスタム', loadExample: 'サンプルデータを読み込む' },
  ko: { title: '외삽 계산기', subtitle: '데이터 범위를 넘어 미래 값 예측', method: '방법', targetX: '목표 X 값', calculate: '계산', addPoint: '데이터 포인트 추가', remove: '삭제', result: '결과', equation: '방정식', rSquared: 'R² 점수', confidence: '신뢰도', extrapolatedValue: '외삽 값', export: '보내기', csv: 'CSV보내기', png: 'PNG보내기', pdf: 'PDF보내기', invalid: '유효한 숫자를 입력하세요', minPoints: '최소 2개의 데이터 포인트가 필요합니다', dataPoints: '데이터 포인트', chartLoading: '차트 로딩 중...', noscript: 'JavaScript가 필요합니다.', demoData: '데모 데이터', custom: '사용자 정의', loadExample: '샘플 데이터 로드' },
  ar: { title: 'حاسبة الاستكمال الخارجي', subtitle: 'تنبأ بالقيم المستقبلية خارج نطاق بياناتك', method: 'طريقة', targetX: 'القيمة المستهدفة X', calculate: 'احسب', addPoint: 'إضافة نقطة بيانات', remove: 'إزالة', result: 'النتيجة', equation: 'المعادلة', rSquared: 'درجة R²', confidence: 'الثقة', extrapolatedValue: 'القيمة المستكملة', export: 'تصدير', csv: 'تصدير CSV', png: 'تصدير PNG', pdf: 'تصدير PDF', invalid: 'أدخل أرقامًا صالحة', minPoints: 'مطلوب نقطتي بيانات على الأقل', dataPoints: 'نقاط البيانات', chartLoading: 'جاري تحميل الرسم البياني...', noscript: 'JavaScript مطلوب.', demoData: 'بيانات تجريبية', custom: 'مخصص', loadExample: 'تحميل بيانات تجريبية' },
  it: { title: 'Calcolatore di Estrapolazione', subtitle: 'Prevedi valori futuri oltre il tuo intervallo di dati', method: 'Metodo', targetX: 'Valore X Target', calculate: 'Calcola', addPoint: 'Aggiungi Punto', remove: 'Rimuovi', result: 'Risultat', equation: 'Equazione', rSquared: 'Punteggio R²', confidence: 'Confidenza', extrapolatedValue: 'Valore Estrapolato', export: 'Esporta', csv: 'Esporta CSV', png: 'Esporta PNG', pdf: 'Esporta PDF', invalid: 'Inserisci numeri validi', minPoints: 'Sono necessari almeno 2 punti', dataPoints: 'Punti Dati', chartLoading: 'Caricamento grafico...', noscript: 'JavaScript è richiesto.', demoData: 'Dati Demo', custom: 'Personalizzato', loadExample: 'Carica Dati di Esempio' },
  pt: { title: 'Calculadora de Extrapolação', subtitle: 'Preveja valores futuros além do seu intervalo de dados', method: 'Método', targetX: 'Valor X Alvo', calculate: 'Calcular', addPoint: 'Adicionar Ponto', remove: 'Remover', result: 'Resultado', equation: 'Equação', rSquared: 'Pontuação R²', confidence: 'Confiança', extrapolatedValue: 'Valor Extrapolaado', export: 'Exportar', csv: 'Exportar CSV', png: 'Exportar PNG', pdf: 'Exportar PDF', invalid: 'Insira números válidos', minPoints: 'São necessários pelo menos 2 pontos', dataPoints: 'Pontos de Dados', chartLoading: 'Carregando gráfico...', noscript: 'JavaScript é necessário.', demoData: 'Dados Demo', custom: 'Personalizado', loadExample: 'Carregar Dados de Exemplo' },
  ru: { title: 'Калькулятор Экстраполяции', subtitle: 'Прогнозируйте будущие значения за пределами вашего диапазона данных', method: 'Метод', targetX: 'Целевое X', calculate: 'Вычислить', addPoint: 'Добавить Точку', remove: 'Удалить', result: 'Результат', equation: 'Уравнение', rSquared: 'Оценка R²', confidence: 'Доверие', extrapolatedValue: 'Экстраполированное Значение', export: 'Экспорт', csv: 'Экспорт CSV', png: 'Экспорт PNG', pdf: 'Экспорт PDF', invalid: 'Введите корректные числа', minPoints: 'Необходимо минимум 2 точки', dataPoints: 'Точки Данных', chartLoading: 'Загрузка графика...', noscript: 'Требуется JavaScript.', demoData: 'Демо-данные', custom: 'Пользовательский', loadExample: 'Загрузить Пример Данных' },
  hi: { title: 'बाह्यगणना कैलकुलेटर', subtitle: 'अपने डेटा सीमा से परे भविष्य के मानों की भविष्यवाणी करें', method: 'विधि', targetX: 'लक्ष्य X', calculate: 'गणना करें', addPoint: 'डेटा बिंदु जोड़ें', remove: 'हटाएं', result: 'परिणाम', equation: 'समीकरण', rSquared: 'R² स्कोर', confidence: 'विश्वास', extrapolatedValue: 'बाह्यगणित मान', export: 'निर्यात', csv: 'CSV निर्यात', png: 'PNG निर्यात', pdf: 'PDF निर्यात', invalid: 'कृपया मान्य संख्या दर्ज करें', minPoints: 'कम से कम 2 डेटा बिंदु आवश्यक', dataPoints: 'डेटा बिंदु', chartLoading: 'चार्ट लोड हो रहा है...', noscript: 'JavaScript आवश्यक है।', demoData: 'डेमो डेटा', custom: 'कस्टम', loadExample: 'उदाहरण डेटा लोड करें' },
  bn: { title: 'বহির্বহন ক্যালকুলেটর', subtitle: 'আপনার ডেটা পরিসীমার বাইরে ভবিষ্যৎ মান অনুমান করুন', method: 'পদ্ধতি', targetX: 'লক্ষ্য X', calculate: 'গণনা করুন', addPoint: 'ডেটা পয়েন্ট যোগ করুন', remove: 'সরান', result: 'ফলাফল', equation: 'সমীকরণ', rSquared: 'R² স্কোর', confidence: 'আস্থা', extrapolatedValue: 'বহির্বহন মান', export: 'রপ্তানি', csv: 'CSV রপ্তানি', png: 'PNG রপ্তানি', pdf: 'PDF রপ্তানি', invalid: 'অনুগ্রহ করে বৈধ সংখ্যা দিন', minPoints: 'কমপক্ষে ২টি ডেটা পয়েন্ট প্রয়োজন', dataPoints: 'ডেটা পয়েন্ট', chartLoading: 'চার্ট লোড হচ্ছে...', noscript: 'JavaScript প্রয়োজন।', demoData: 'ডেমো ডেটা', custom: 'কাস্টম', loadExample: 'উদাহরণ ডেটা লোড করুন' },
  ms: { title: 'Kalkulator Ekstrapolasi', subtitle: 'Ramal nilai masa hadapan di luar julat data anda', method: 'Kaedah', targetX: 'Nilai X Sasaran', calculate: 'Kira', addPoint: 'Tambah Titik Data', remove: 'Buang', result: 'Keputusan', equation: 'Persamaan', rSquared: 'Skor R²', confidence: 'Keyakinan', extrapolatedValue: 'Nilai Ekstrapolasi', export: 'Eksport', csv: 'Eksport CSV', png: 'Eksport PNG', pdf: 'Eksport PDF', invalid: 'Sila masukkan nombor yang sah', minPoints: 'Sekurang-kurangnya 2 titik data diperlukan', dataPoints: 'Titik Data', chartLoading: 'Memuatkan carta...', noscript: 'JavaScript diperlukan.', demoData: 'Data Demo', custom: 'Tersuai', loadExample: 'Muat Data Contoh' },
  pl: { title: 'Kalkulator Ekstrapolacji', subtitle: 'Przewiduj przyszłe wartości poza zakresem danych', method: 'Metoda', targetX: 'Docelowe X', calculate: 'Oblicz', addPoint: 'Dodaj Punkt', remove: 'Usuń', result: 'Wynik', equation: 'Równanie', rSquared: 'Wynik R²', confidence: 'Pewność', extrapolatedValue: 'Wartość Ekstrapolowana', export: 'Eksportuj', csv: 'Eksportuj CSV', png: 'Eksportuj PNG', pdf: 'Eksportuj PDF', invalid: 'Podaj prawidłowe liczby', minPoints: 'Wymagane co najmniej 2 punkty', dataPoints: 'Punkty Danych', chartLoading: 'Ładowanie wykresu...', noscript: 'Wymagany jest JavaScript.', demoData: 'Dane Demo', custom: 'Niestandardowy', loadExample: 'Załaduj Dane Przykładowe' },
  id: { title: 'Kalkulator Ekstrapolasi', subtitle: 'Prediksi nilai masa depan di luar rentang data Anda', method: 'Metode', targetX: 'Nilai X Target', calculate: 'Hitung', addPoint: 'Tambah Titik Data', remove: 'Hapus', result: 'Hasil', equation: 'Persamaan', rSquared: 'Skor R²', confidence: 'Kepercayaan', extrapolatedValue: 'Nilai Ekstrapolasi', export: 'Ekspor', csv: 'Ekspor CSV', png: 'Ekspor PNG', pdf: 'Ekspor PDF', invalid: 'Masukkan angka yang valid', minPoints: 'Minimal 2 titik data diperlukan', dataPoints: 'Titik Data', chartLoading: 'Memuat grafik...', noscript: 'Diperlukan JavaScript.', demoData: 'Data Demo', custom: 'Kustom', loadExample: 'Muat Data Contoh' },
  bg: { title: 'Калкулатор за Екстраполация', subtitle: 'Прогнозирайте бъдещи стойности извън обхвата на данните', method: 'Метод', targetX: 'Целева X Стойност', calculate: 'Изчисли', addPoint: 'Добави Точка', remove: 'Премахни', result: 'Резултат', equation: 'Уравнение', rSquared: 'R² Резултат', confidence: 'Доверие', extrapolatedValue: 'Екстраполирана Стойност', export: 'Експорт', csv: 'CSV Експорт', png: 'PNG Експорт', pdf: 'PDF Експорт', invalid: 'Въведете валидни числа', minPoints: 'Необходими са поне 2 точки', dataPoints: 'Точки Данни', chartLoading: 'Зареждане на графиката...', noscript: 'Необходим е JavaScript.', demoData: 'Демо Данни', custom: 'Персонализиран', loadExample: 'Зареди Примерни Данни' },
  tr: { title: 'Ekstrapolasyon Hesaplayıcısı', subtitle: 'Veri aralığınızın ötesinde gelecek değerleri tahmin edin', method: 'Yöntem', targetX: 'Hedef X Değeri', calculate: 'Hesapla', addPoint: 'Veri Noktası Ekle', remove: 'Kaldır', result: 'Sonuç', equation: 'Denklem', rSquared: 'R² Skoru', confidence: 'Güven', extrapolatedValue: 'Ekstrapole Edilen Değer', export: 'Dışa Aktar', csv: 'CSV Dışa Aktar', png: 'PNG Dışa Aktar', pdf: 'PDF Dışa Aktar', invalid: 'Geçerli sayılar girin', minPoints: 'En az 2 veri noktası gerekli', dataPoints: 'Veri Noktaları', chartLoading: 'Grafik yükleniyor...', noscript: 'JavaScript gereklidir.', demoData: 'Demo Verileri', custom: 'Özel', loadExample: 'Örnek Veri Yükle' },
  sv: { title: 'Extrapoleringskalkylator', subtitle: 'Förutsäg framtida värden utanför din dataräckvidd', method: 'Metod', targetX: 'Målvärde X', calculate: 'Beräkna', addPoint: 'Lägg Till Datapunkt', remove: 'Ta Bort', result: 'Resultat', equation: 'Ekvation', rSquared: 'R²-poäng', confidence: 'Förtroende', extrapolatedValue: 'Extrapolerat Värde', export: 'Exportera', csv: 'Exportera CSV', png: 'Exportera PNG', pdf: 'Exportera PDF', invalid: 'Ange giltiga siffror', minPoints: 'Minst 2 datapunkter krävs', dataPoints: 'Datapunkter', chartLoading: 'Laddar diagram...', noscript: 'JavaScript krävs.', demoData: 'Demodata', custom: 'Anpassad', loadExample: 'Ladda Exempeldata' },
};
