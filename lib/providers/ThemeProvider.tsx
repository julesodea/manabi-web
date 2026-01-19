"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeColor = "white" | "blue" | "red" | "green" | "black";

interface ThemeColors {
  primary: string;      // Accent color
  background: string;   // Page background
  foreground: string;   // Main text
  cardBg: string;       // Card/content areas
  muted: string;        // Secondary text
  border: string;       // Subtle borders
  isDark: boolean;      // Dark mode flag
}

const themeColorMap: Record<ThemeColor, ThemeColors> = {
  white: {
    primary: "#FF6B35",
    background: "#FFFFFF",
    foreground: "#1a1a1a",
    cardBg: "#F5F5F5",
    muted: "#6B7280",
    border: "#E5E7EB",
    isDark: false,
  },
  blue: {
    primary: "#3B82F6",
    background: "#1a1a1a",
    foreground: "#FFFFFF",
    cardBg: "#2a2a2a",
    muted: "#9CA3AF",
    border: "#374151",
    isDark: true,
  },
  red: {
    primary: "#EF4444",
    background: "#1a1a1a",
    foreground: "#FFFFFF",
    cardBg: "#2a2a2a",
    muted: "#9CA3AF",
    border: "#374151",
    isDark: true,
  },
  green: {
    primary: "#22C55E",
    background: "#1a1a1a",
    foreground: "#FFFFFF",
    cardBg: "#2a2a2a",
    muted: "#9CA3AF",
    border: "#374151",
    isDark: true,
  },
  black: {
    primary: "#FF6B35",
    background: "#0a0a0a",
    foreground: "#FFFFFF",
    cardBg: "#1a1a1a",
    muted: "#9CA3AF",
    border: "#2a2a2a",
    isDark: true,
  },
};

interface ThemeContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>("white");
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme-color") as ThemeColor;
    if (savedTheme && themeColorMap[savedTheme]) {
      setThemeColorState(savedTheme);
    }
    setMounted(true);
  }, []);

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    localStorage.setItem("theme-color", color);

    // Update data-theme attribute (CSS will handle the colors)
    document.documentElement.setAttribute("data-theme", color);
  };

  // Update data-theme attribute when theme changes
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", themeColor);
    }
  }, [themeColor, mounted]);

  // Add theme-loaded class when React has hydrated
  useEffect(() => {
    if (mounted) {
      // Use requestAnimationFrame to ensure CSS variables are applied
      requestAnimationFrame(() => {
        document.documentElement.classList.add('theme-loaded');
      });
    }
  }, [mounted]);

  return (
    <ThemeContext.Provider
      value={{
        themeColor,
        setThemeColor,
        colors: themeColorMap[themeColor],
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
