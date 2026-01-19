'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

type ThemeContextType = {
  theme: string;
  setTheme: (t: string) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be inside ThemeProvider");
  return ctx;
};

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("light");
  const [accentColor, setAccentColor] = useState("teal");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from cookie
  useEffect(() => {
    const savedTheme = Cookies.get("user_theme");
    const savedAccent = Cookies.get("accent_color");

    if (savedTheme) setTheme(savedTheme);
    if (savedAccent) setAccentColor(savedAccent);

    setIsLoaded(true);
  }, []);

  // Apply instantly
  useEffect(() => {
    if (!isLoaded) return;

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);

    document.documentElement.setAttribute("data-accent", accentColor);

    Cookies.set("user_theme", theme, { expires: 365 });
    Cookies.set("accent_color", accentColor, { expires: 365 });
  }, [theme, accentColor, isLoaded]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
