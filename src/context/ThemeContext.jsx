import { createContext, useContext, useEffect, useState } from "react";
// Import the theme data and helper from your component file
import { THEMES, applyThemeVars } from "../component/ThemeDropdown"; 

const ThemeContext = createContext();
const THEME_KEY = "chat_theme_pref";

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || "Default";
  });

  useEffect(() => {
    // 1. Save to local storage
    localStorage.setItem(THEME_KEY, currentTheme);

    // 2. Apply the CSS variables to the document root immediately
    const themeData = THEMES[currentTheme] || THEMES.Default;
    applyThemeVars(themeData.vars, document.documentElement);
    
    // 3. Keep your data-attribute for standard CSS selectors
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, THEME_KEY }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);