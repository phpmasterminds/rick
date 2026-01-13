'use client';
import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import Cookies from "js-cookie";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("light");
  const [accentColor, setAccentColor] = useState("teal");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Track if theme is loaded

  const colors = [
    { name: "teal", color: "#14B8A6", label: "Teal" },
    { name: "blue", color: "#3B82F6", label: "Blue" },
    { name: "purple", color: "#A855F7", label: "Purple" },
    { name: "pink", color: "#EC4899", label: "Pink" },
    { name: "green", color: "#10B981", label: "Green" },
    { name: "orange", color: "#F97316", label: "Orange" },
    { name: "red", color: "#EF4444", label: "Red" },
    { name: "indigo", color: "#6366F1", label: "Indigo" },
  ];

  // ===== LOAD THEME FROM COOKIE ON MOUNT =====
  useEffect(() => {
    // Get theme from cookie (set on login)
    const savedTheme = Cookies.get("user_theme");
    const accentColorCookie = Cookies.get("accent_color");
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Fallback to system preference if no cookie
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }

    if (accentColorCookie && colors.find(c => c.name === accentColorCookie)) {
      setAccentColor(accentColorCookie);
    }

    setIsLoaded(true);
  }, []);

  // ===== APPLY THEME TO DOM =====
  useEffect(() => {
    if (!isLoaded) return; // Wait for cookie to load

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.setAttribute("data-accent", accentColor);

    // Also set data attribute on body for better compatibility
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  }, [theme, accentColor, isLoaded]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    // Save to cookie immediately
    Cookies.set("user_theme", newTheme, { expires: 365 });
  };

  const handleColorChange = (colorName: string) => {
    setAccentColor(colorName);
    setShowThemeMenu(false);
    // Save accent color to cookie
    Cookies.set("accent_color", colorName, { expires: 365 });
  };

  return (
    <div className={theme} data-accent={accentColor}>
      <style>{`
        [data-accent="teal"] { --accent-color: #14B8A6; --accent-hover: #0D9488; }
        [data-accent="blue"] { --accent-color: #3B82F6; --accent-hover: #2563EB; }
        [data-accent="purple"] { --accent-color: #A855F7; --accent-hover: #9333EA; }
        [data-accent="pink"] { --accent-color: #EC4899; --accent-hover: #DB2777; }
        [data-accent="green"] { --accent-color: #10B981; --accent-hover: #059669; }
        [data-accent="orange"] { --accent-color: #F97316; --accent-hover: #EA580C; }
        [data-accent="red"] { --accent-color: #EF4444; --accent-hover: #DC2626; }
        [data-accent="indigo"] { --accent-color: #6366F1; --accent-hover: #4F46E5; }
        .accent-bg { background-color: var(--accent-color); }
        .accent-hover:hover { background-color: var(--accent-hover); }
        .accent-text { color: var(--accent-color); }
        .accent-border { border-color: var(--accent-color); }
      `}</style>

      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {children}

        {/* Floating Theme Buttons 
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          <button
            onClick={toggleTheme}
            className="p-3 accent-bg accent-hover text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-3 accent-bg accent-hover text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
              title="Change Accent Color"
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-white"
                style={{ backgroundColor: colors.find(c => c.name === accentColor)?.color }}
              />
            </button>

            {showThemeMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-48">
                <h3 className="text-sm font-semibold mb-3">Choose Theme Color</h3>
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => handleColorChange(c.name)}
                      className={`w-10 h-10 rounded-lg transition-all duration-300 hover:scale-110 ${
                        accentColor === c.name ? 'ring-2 ring-gray-900 dark:ring-gray-100 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>*/}
      </div>
    </div>
  );
}

export default ThemeProvider; // ✅ This line is critical