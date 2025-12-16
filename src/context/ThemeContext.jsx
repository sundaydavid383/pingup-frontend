import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const THEME_KEY = "chat_theme";
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || "Default";
    } catch {
      return "Default";
    }
  });

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, THEME_KEY }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
