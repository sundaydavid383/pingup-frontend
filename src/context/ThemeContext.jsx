import { createContext, useContext, useEffect, useState, useCallback } from "react";
// Import the theme data and helper from your component file
import { THEMES, applyThemeVars } from "../component/ThemeDropdown"; 

const ThemeContext = createContext();
const THEME_KEY = "chat_theme_pref";

// Map settings values to theme keys
const themeMap = {
  'light': 'Default',
  'dark': 'Dark',
  'system': 'system',
  'Default': 'Default',
  'Dark': 'Dark',
  'Ocean': 'Ocean',
  'Forest': 'Forest',
  'Candy': 'Candy'
};

// Get system preference
const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Default';
  }
  return 'Default';
};

// Get effective theme based on current setting
const getEffectiveTheme = (themeSetting) => {
  if (themeSetting === 'system') {
    return getSystemTheme();
  }
  return themeMap[themeSetting] || 'Default';
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    // Default to system if no stored value
    return 'system';
  });

  // Apply theme with transition to avoid flash
  const applyTheme = useCallback((themeKey) => {
    const effectiveTheme = getEffectiveTheme(themeKey);
    const themeData = THEMES[effectiveTheme] || THEMES.Default;
    
    // Add transition class before applying theme
    document.documentElement.classList.add('theme-transitioning');
    
    applyThemeVars(themeData.vars, document.documentElement);
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    
    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);
  }, []);

  useEffect(() => {
    // 1. Save to local storage
    localStorage.setItem(THEME_KEY, currentTheme);

    // 2. Apply the CSS variables to the document root immediately
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (currentTheme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme('system');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme, applyTheme]);

  // Provide a function to get the current effective theme
  const getEffectiveThemeKey = useCallback(() => {
    return getEffectiveTheme(currentTheme);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      setCurrentTheme, 
      THEME_KEY,
      getEffectiveTheme: getEffectiveThemeKey
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
