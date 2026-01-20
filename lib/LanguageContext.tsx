
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

type Language = 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['tr']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Turkish ('tr') as per request to remove switching/en
  const [language, setLanguage] = useState<Language>('tr');

  useEffect(() => {
    const savedLang = localStorage.getItem('app-language') as Language;
    if (savedLang) setLanguage(savedLang);
    else setLanguage('tr'); // Default TR
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: keyof typeof translations['tr']) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
