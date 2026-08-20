import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getJsonItem, setJsonItem } from '@/storage/asyncStorage';
import { translations, type Language } from './translations';
import { LANGUAGES } from './translations';

const STORAGE_KEY = 'gebetago.language';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (typeof translations)[Language];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    void getJsonItem<Language>(STORAGE_KEY).then((stored) => {
      if (stored && LANGUAGES.includes(stored)) {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void setJsonItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
