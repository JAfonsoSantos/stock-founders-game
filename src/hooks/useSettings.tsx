import { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface SettingsContextType {
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  resolvedTheme: string | undefined;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [compactMode, setCompactModeState] = useState(false);

  useEffect(() => {
    // Load compact mode from localStorage
    const savedCompactMode = localStorage.getItem('compactMode');
    if (savedCompactMode !== null) {
      setCompactModeState(JSON.parse(savedCompactMode));
    }
  }, []);

  const setCompactMode = (compact: boolean) => {
    setCompactModeState(compact);
    localStorage.setItem('compactMode', JSON.stringify(compact));
    
    // Apply compact mode to body class
    if (compact) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  };

  // Apply compact mode on mount if enabled
  useEffect(() => {
    if (compactMode) {
      document.body.classList.add('compact-mode');
    }
  }, [compactMode]);

  return (
    <SettingsContext.Provider value={{ 
      compactMode, 
      setCompactMode, 
      theme, 
      setTheme, 
      resolvedTheme 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}