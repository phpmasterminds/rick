'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import Cookies from "js-cookie";

/* ----------------------------------
   Types
----------------------------------- */

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
};

/* ----------------------------------
   Context
----------------------------------- */

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used inside ThemeProvider");
  }
  return ctx;
};

/* ----------------------------------
   Provider
----------------------------------- */

function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 🔒 HARD DEFAULTS (never undefined)
  const [theme, setTheme] = useState<Theme>("light");
  const [accentColor, setAccentColor] = useState("teal");
  const [isLoaded, setIsLoaded] = useState(false);

  /* ----------------------------------
     Load from cookies (SAFE)
  ----------------------------------- */
  useEffect(() => {
    const savedTheme = Cookies.get("user_theme");
    const savedAccent = Cookies.get("accent_color");

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else {
      setTheme("light"); // ✅ fallback
    }

    if (typeof savedAccent === "string" && savedAccent.trim() !== "") {
      setAccentColor(savedAccent);
    }

    setIsLoaded(true);
  }, []);

  /* ----------------------------------
     Apply instantly to DOM
  ----------------------------------- */
  useEffect(() => {
    if (!isLoaded) return;

    const safeTheme: Theme = theme === "dark" ? "dark" : "light";

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(safeTheme);

    document.documentElement.setAttribute(
      "data-accent",
      accentColor
    );

    Cookies.set("user_theme", safeTheme, { expires: 365 });
    Cookies.set("accent_color", accentColor, { expires: 365 });
  }, [theme, accentColor, isLoaded]);

  /* ----------------------------------
     Render
  ----------------------------------- */
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
