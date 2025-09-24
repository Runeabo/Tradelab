import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Define the shape of the context
interface LocalizationContextType {
  t: (key: string, replacements?: Record<string, string | number>) => any;
  isLoaded: boolean;
}

// Create the context with a default value
const LocalizationContext = createContext<LocalizationContextType>({
  t: (key) => key,
  isLoaded: false,
});

// Custom hook for easy consumption
export const useLocalization = () => useContext(LocalizationContext);

// The provider component
interface LocalizationProviderProps {
  children: ReactNode;
}

// Utility to get a nested property from an object using a dot-notation string
const getNested = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    fetch('/en.json')
      .then(res => res.json())
      .then(data => setTranslations(data))
      .catch(err => console.error("Failed to load translations:", err));
  }, []);

  const t = (key: string, replacements?: Record<string, string | number>): any => {
    if (!translations) {
      return key; // Return key if translations are not loaded
    }
    let translation = getNested(translations, key) || key;

    if (typeof translation === 'string' && replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(
                new RegExp(`{{${placeholder}}}`, 'g'), 
                String(replacements[placeholder])
            );
        });
    }

    return translation;
  };

  const isLoaded = translations !== null;

  return (
    <LocalizationContext.Provider value={{ t, isLoaded }}>
      {isLoaded ? children : <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div></div>}
    </LocalizationContext.Provider>
  );
};
