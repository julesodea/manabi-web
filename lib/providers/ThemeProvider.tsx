"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeColor = "blue" | "red" | "green" | "black";

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  gradient: string;
}

const themeColorMap: Record<ThemeColor, ThemeColors> = {
  blue: {
    primary: "#3B82F6", // blue-500
    primaryDark: "#2563EB", // blue-600
    primaryLight: "#DBEAFE", // blue-100
    gradient: "from-[#3B82F6] to-[#2563EB]",
  },
  red: {
    primary: "#EF4444", // red-500
    primaryDark: "#DC2626", // red-600
    primaryLight: "#FEE2E2", // red-100
    gradient: "from-[#EF4444] to-[#DC2626]",
  },
  green: {
    primary: "#22C55E", // green-500
    primaryDark: "#16A34A", // green-600
    primaryLight: "#DCFCE7", // green-100
    gradient: "from-[#22C55E] to-[#16A34A]",
  },
  black: {
    primary: "#1E293B", // slate-800
    primaryDark: "#0F172A", // slate-900
    primaryLight: "#E2E8F0", // slate-200
    gradient: "from-[#1E293B] to-[#0F172A]",
  },
};

interface ThemeContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>("blue");
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
