import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  RTL_LOCALES,
  isRtl,
  isDefaultLocale,
  localizePath,
  getLocaleLabel,
  getAlternateUrls,
  t,
} from '../../theme/i18n/utils';

describe('i18n utilities', () => {
  describe('SUPPORTED_LOCALES', () => {
    it('should have 18 locales', () => {
      expect(SUPPORTED_LOCALES).toHaveLength(18);
    });

    it('should include English as the first locale', () => {
      expect(SUPPORTED_LOCALES[0]).toBe('en');
    });

    it('should include Arabic for RTL support', () => {
      expect(SUPPORTED_LOCALES).toContain('ar');
    });
  });

  describe('isRtl', () => {
    it('should return true for Arabic', () => {
      expect(isRtl('ar')).toBe(true);
    });

    it('should return false for English', () => {
      expect(isRtl('en')).toBe(false);
    });

    it('should return false for all non-Arabic locales', () => {
      const nonArabic = SUPPORTED_LOCALES.filter((l) => l !== 'ar');
      nonArabic.forEach((locale) => {
        expect(isRtl(locale)).toBe(false);
      });
    });
  });

  describe('isDefaultLocale', () => {
    it('should return true for English', () => {
      expect(isDefaultLocale('en')).toBe(true);
    });

    it('should return false for any other locale', () => {
      expect(isDefaultLocale('es')).toBe(false);
      expect(isDefaultLocale('ar')).toBe(false);
    });
  });

  describe('localizePath', () => {
    it('should not prefix the default locale', () => {
      expect(localizePath('/about-us/', 'en')).toBe('/about-us/');
    });

    it('should prefix non-default locales', () => {
      expect(localizePath('/about-us/', 'es')).toBe('/es/about-us/');
      expect(localizePath('/', 'fr')).toBe('/fr/');
    });
  });

  describe('getLocaleLabel', () => {
    it('should return a label for every supported locale', () => {
      SUPPORTED_LOCALES.forEach((locale) => {
        const label = getLocaleLabel(locale);
        expect(label).toBeDefined();
        expect(label.length).toBeGreaterThan(0);
      });
    });

    it('should return English for en', () => {
      expect(getLocaleLabel('en')).toBe('English');
    });

    it('should return Arabic script for ar', () => {
      expect(getLocaleLabel('ar')).toBe('العربية');
    });
  });

  describe('getAlternateUrls', () => {
    it('should generate URLs for all 18 locales', () => {
      const urls = getAlternateUrls('/');
      expect(urls).toHaveLength(18);
    });

    it('should have unprefixed URL for English', () => {
      const urls = getAlternateUrls('/');
      const enUrl = urls.find((u) => u.locale === 'en');
      expect(enUrl?.url).toBe('/');
    });

    it('should have prefixed URL for non-English', () => {
      const urls = getAlternateUrls('/');
      const esUrl = urls.find((u) => u.locale === 'es');
      expect(esUrl?.url).toBe('/es/');
    });
  });

  describe('t (translations)', () => {
    it('should return English strings for en', () => {
      expect(t('en', 'site.title')).toBe('Extrapolation Calculator');
      expect(t('en', 'nav.home')).toBe('Home');
    });

    it('should return localized strings for other locales', () => {
      expect(t('es', 'nav.home')).toBe('Inicio');
      expect(t('fr', 'nav.home')).toBe('Accueil');
    });

    it('should fall back to English for missing keys', () => {
      expect(t('en', 'nonexistent.key')).toBe('nonexistent.key');
    });

    it('should have common keys translated for all locales', () => {
      const commonKeys = ['site.title', 'nav.home', 'calc.title', 'contact.send'];
      SUPPORTED_LOCALES.forEach((locale) => {
        commonKeys.forEach((key) => {
          const translation = t(locale, key);
          expect(translation).toBeDefined();
          expect(translation.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
