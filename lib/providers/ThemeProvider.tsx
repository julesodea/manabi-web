"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeColor = "neutral" | "blue" | "red" | "green" | "orange";
export type ThemeMode = "light" | "dark";

interface ThemeColors {
  primary: string;      // Accent color
  primaryText: string;  // Text color on accent surfaces
  background: string;   // Page background
  foreground: string;   // Main text
  cardBg: string;       // Card/content areas
  muted: string;        // Secondary text
  border: string;       // Subtle borders
  isDark: boolean;      // Dark mode flag
}

const getThemeColors = (color: ThemeColor, mode: ThemeMode): ThemeColors => {
  const accentColors: Record<ThemeColor, string> = {
    neutral: mode === "light" ? "#1a1a1a" : "#FFFFFF",
    blue: "#3B82F6",
    red: "#EF4444",
    green: "#22C55E",
    orange: "#FF6B35",
  };

  if (mode === "light") {
    return {
      primary: accentColors[color],
      primaryText: "#FFFFFF",
      background: "#FFFFFF",
      foreground: "#1a1a1a",
      cardBg: "#F5F5F5",
      muted: "#6B7280",
      border: "#E5E7EB",
      isDark: false,
    };
  } else {
    // Dark mode
    const isDeeperDark = color === "neutral";
    return {
      primary: accentColors[color],
      primaryText: color === "neutral" ? "#000000" : "#FFFFFF",
      background: isDeeperDark ? "#0a0a0a" : "#1a1a1a",
      foreground: "#FFFFFF",
      cardBg: isDeeperDark ? "#1a1a1a" : "#2a2a2a",
      muted: "#9CA3AF",
      border: isDeeperDark ? "#2a2a2a" : "#374151",
      isDark: true,
    };
  }
};

interface ThemeContextType {
  themeColor: ThemeColor;
  themeMode: ThemeMode;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const validThemeColors: ThemeColor[] = ["neutral", "blue", "red", "green", "orange"];
const validThemeModes: ThemeMode[] = ["light", "dark"];

const getStoredThemePreference = (): { color: ThemeColor; mode: ThemeMode } => {
  const preference: { color: ThemeColor; mode: ThemeMode } = {
    color: "neutral",
    mode: "light",
  };

  if (typeof window === "undefined") {
    return preference;
  }

  const savedColor = localStorage.getItem("theme-color");
  const savedMode = localStorage.getItem("theme-mode");
  const colorMap: Record<string, { color: ThemeColor; mode: ThemeMode }> = {
    white: { color: "neutral", mode: "light" },
    black: { color: "neutral", mode: "dark" },
    "blue-light": { color: "blue", mode: "light" },
    blue: { color: "blue", mode: "dark" },
    "red-light": { color: "red", mode: "light" },
    red: { color: "red", mode: "dark" },
    "green-light": { color: "green", mode: "light" },
    green: { color: "green", mode: "dark" },
    "orange-light": { color: "orange", mode: "light" },
    orange: { color: "orange", mode: "dark" },
  };

  if (savedColor) {
    const mapped = colorMap[savedColor];
    if (mapped) {
      preference.color = mapped.color;
      preference.mode = mapped.mode;
    } else if (validThemeColors.includes(savedColor as ThemeColor)) {
      preference.color = savedColor as ThemeColor;
    }
  }

  if (savedMode && validThemeModes.includes(savedMode as ThemeMode)) {
    preference.mode = savedMode as ThemeMode;
  }

  return preference;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>(
    () => getStoredThemePreference().color
  );
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    () => getStoredThemePreference().mode
  );

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    localStorage.setItem("theme-color", color);
    updateDataTheme(color, themeMode);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem("theme-mode", mode);
    updateDataTheme(themeColor, mode);
  };

  const toggleThemeMode = () => {
    setThemeMode(themeMode === "light" ? "dark" : "light");
  };

  const updateDataTheme = (color: ThemeColor, mode: ThemeMode) => {
    const themeValue = color === "neutral"
      ? (mode === "light" ? "white" : "black")
      : `${color}${mode === "light" ? "-light" : ""}`;
    document.documentElement.setAttribute("data-theme", themeValue);
  };

  // Update data-theme attribute when theme changes
  useEffect(() => {
    updateDataTheme(themeColor, themeMode);
    requestAnimationFrame(() => {
      document.documentElement.classList.add("theme-loaded");
    });
  }, [themeColor, themeMode]);

  return (
    <ThemeContext.Provider
      value={{
        themeColor,
        themeMode,
        setThemeColor,
        setThemeMode,
        toggleThemeMode,
        colors: getThemeColors(themeColor, themeMode),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
