import { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'en' | 'pt' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ar' | 'hi' | 'ru';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [messages, setMessages] = useState<Record<string, any>>({});

  useEffect(() => {
    // Load locale from localStorage or browser
    const savedLocale = localStorage.getItem('locale') as Locale;
    const browserLocale = navigator.language.split('-')[0] as Locale;
    const supportedLocales: Locale[] = ['en', 'pt', 'es', 'fr', 'de', 'zh', 'ja', 'ar', 'hi', 'ru'];
    
    const initialLocale = savedLocale || 
      (supportedLocales.includes(browserLocale) ? browserLocale : 'en');
    
    // Set initial locale without triggering async loading in useEffect
    setLocaleState(initialLocale);
    
    // Load initial messages
    const loadInitialMessages = async () => {
      try {
        const messagesModule = await import(`../messages/${initialLocale}.json`);
        setMessages(messagesModule.default);
      } catch (error) {
        console.error(`Failed to load messages for locale ${initialLocale}:`, error);
        try {
          const messagesModule = await import(`../messages/en.json`);
          setMessages(messagesModule.default);
        } catch (fallbackError) {
          console.error('Failed to load fallback messages:', fallbackError);
          setMessages({});
        }
      }
    };
    
    loadInitialMessages();
  }, []);

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    
    try {
      const messagesModule = await import(`../messages/${newLocale}.json`);
      setMessages(messagesModule.default);
    } catch (error) {
      console.error(`Failed to load messages for locale ${newLocale}:`, error);
      // Fallback to English
      try {
        const messagesModule = await import(`../messages/en.json`);
        setMessages(messagesModule.default);
      } catch (fallbackError) {
        console.error('Failed to load fallback messages:', fallbackError);
        setMessages({});
      }
    }
  };

  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    if (typeof value !== 'string') {
      return key; // Return the key if translation not found
    }
    
    // Replace parameters
    let result: string = value;
    if (params) {
      Object.entries(params).forEach(([param, replacement]) => {
        result = result.replace(`{{${param}}}`, replacement);
      });
    }
    
    return result;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
] as const;