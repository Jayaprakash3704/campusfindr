/**
 * CampusFindr — Theme Context
 * Manages light/dark mode preference.
 * Reads from localStorage ('cf_theme') and respects prefers-color-scheme on first load.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'cf_theme';
const ThemeContext = createContext(null);

function getInitialTheme() {
  // This runs on the JS side — the inline script in index.html handles first-paint
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
