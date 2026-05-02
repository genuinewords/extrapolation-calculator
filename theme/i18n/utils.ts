export const SUPPORTED_LOCALES = [
  'en', 'hi', 'es', 'ru', 'fr', 'de', 'it', 'pt',
  'bn', 'ja', 'ko', 'ms', 'pl', 'id', 'ar', 'bg', 'tr', 'sv',
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const RTL_LOCALES: Locale[] = ['ar'];

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function isDefaultLocale(locale: Locale): boolean {
  return locale === DEFAULT_LOCALE;
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, maybeLocale] = url.pathname.split('/');
  if (SUPPORTED_LOCALES.includes(maybeLocale as Locale)) {
    return maybeLocale as Locale;
  }
  return DEFAULT_LOCALE;
}

export function localizePath(path: string, locale: Locale): string {
  if (isDefaultLocale(locale)) return path;
  return `/${locale}${path}`;
}

export function getLocaleLabel(locale: Locale): string {
  const labels: Record<Locale, string> = {
    en: 'English',
    hi: 'हिन्दी',
    es: 'Español',
    ru: 'Русский',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    bn: 'বাংলা',
    ja: '日本語',
    ko: '한국어',
    ms: 'Bahasa Melayu',
    pl: 'Polski',
    id: 'Bahasa Indonesia',
    ar: 'العربية',
    bg: 'Български',
    tr: 'Türkçe',
    sv: 'Svenska',
  };
  return labels[locale];
}

export { t } from './translations';

export { t } from './translations';

export function getAlternateUrls(currentPath: string): Array<{ locale: Locale; url: string }> {
  const pathWithoutLocale = currentPath.replace(/^\/(en|hi|es|ru|fr|de|it|pt|bn|ja|ko|ms|pl|id|ar|bg|tr|sv)/, '') || '/';
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
    url: localizePath(pathWithoutLocale, locale),
  }));
}
