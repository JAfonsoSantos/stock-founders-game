// Simple i18n configuration for React + Vite

// Can be imported from a shared config
export const locales = ['en', 'pt', 'es', 'fr', 'de', 'it', 'zh', 'ja', 'ko', 'ar'] as const;
export type Locale = typeof locales[number];

export async function loadMessages(locale: Locale) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    locale = 'en'; // fallback to English
  }

  try {
    const messages = await import(`../messages/${locale}.json`);
    return messages.default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Fallback to English
    const messages = await import(`../messages/en.json`);
    return messages.default;
  }
}