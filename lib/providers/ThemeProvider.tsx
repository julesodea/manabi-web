"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeColor = "blue" | "red" | "green" | "purple" | "black";

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  gradient: string;
}

const themeColorMap: Record<ThemeColor, ThemeColors> = {
  blue: {
    primary: "#5B7FFF",
    primaryDark: "#4A6FEE",
    primaryLight: "#E8ECFF",
    gradient: "from-[#5B7FFF] to-[#4A6FEE]",
  },
  red: {
    primary: "#F87171", // red-400
    primaryDark: "#EF4444", // red-500
    primaryLight: "#FEE2E2", // red-100
    gradient: "from-[#F87171] to-[#EF4444]",
  },
  green: {
    primary: "#4ADE80", // green-400
    primaryDark: "#22C55E", // green-500
    primaryLight: "#DCFCE7", // green-100
    gradient: "from-[#4ADE80] to-[#22C55E]",
  },
  purple: {
    primary: "#C084FC", // purple-400
    primaryDark: "#A855F7", // purple-500
    primaryLight: "#F3E8FF", // purple-100
    gradient: "from-[#C084FC] to-[#A855F7]",
  },
  black: {
    primary: "#374151", // gray-700
    primaryDark: "#1F2937", // gray-800
    primaryLight: "#F3F4F6", // gray-100
    gradient: "from-[#374151] to-[#1F2937]",
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
    
    // Update CSS variables
    const colors = themeColorMap[color];
    document.documentElement.style.setProperty("--theme-primary", colors.primary);
    document.documentElement.style.setProperty("--theme-primary-dark", colors.primaryDark);
    document.documentElement.style.setProperty("--theme-primary-light", colors.primaryLight);
  };

  // Update CSS variables when theme changes
  useEffect(() => {
    if (mounted) {
      const colors = themeColorMap[themeColor];
      document.documentElement.style.setProperty("--theme-primary", colors.primary);
      document.documentElement.style.setProperty("--theme-primary-dark", colors.primaryDark);
      document.documentElement.style.setProperty("--theme-primary-light", colors.primaryLight);
    }
  }, [themeColor, mounted]);

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
