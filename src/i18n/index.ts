import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from '@/i18n/locales/en.json';
import ja from '@/i18n/locales/ja.json';

// Detect device language
const deviceLanguage = getLocales()[0]?.languageCode || 'en';

const LANGUAGE_STORAGE_KEY = '@app_language';

// Language resources
const resources = {
  en: {
    translation: en,
  },
  ja: {
    translation: ja,
  },
};

// Supported languages
export const supportedLanguages = ['en', 'ja'];

// Get stored language or use device/default
const getInitialLanguage = async (): Promise<string> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
      return storedLanguage;
    }

    // Map device language to supported language
    const languageMap: { [key: string]: string } = {
      en: 'en',
      ja: 'ja',
      jp: 'ja',
    };

    const mappedLanguage = languageMap[deviceLanguage];

    if (mappedLanguage && supportedLanguages.includes(mappedLanguage)) {
      return mappedLanguage;
    }

    // Fallback to default
    return 'en';
  } catch (error) {
    console.error('[i18n] Error getting language:', error);
    return 'en';
  }
};

// Initialize i18n
export const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    showSupportNotice: false,
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
};

// Change language
export const changeLanguage = async (language: string) => {
  if (!supportedLanguages.includes(language)) {
    console.error('[i18n] Unsupported language:', language);
    return;
  }

  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

export const getLanguageDisplayName = (code: string): string => {
  const names: { [key: string]: string } = {
    en: 'English',
    ja: '日本語',
  };
  return names[code] || code;
};

export default i18n;
