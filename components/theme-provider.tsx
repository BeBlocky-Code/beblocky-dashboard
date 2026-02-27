"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const cookieTheme = (() => {
      if (typeof document === "undefined") return null;
      const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith("beblocky_theme="));
      if (!match) return null;
      const value = match.split("=")[1] as "light" | "dark" | undefined;
      return value === "light" || value === "dark" ? value : null;
    })();

    if (cookieTheme) {
      setTheme(cookieTheme);
      document.documentElement.classList.toggle("dark", cookieTheme === "dark");
      return;
    }

    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");

    const hostname = window.location.hostname;
    const isBeblockyDomain = hostname.endsWith(".beblocky.com");
    const cookieBase = `beblocky_theme=${theme}; Path=/; Max-Age=${
      60 * 60 * 24 * 365
    }; SameSite=Lax`;
    document.cookie = isBeblockyDomain
      ? `${cookieBase}; Domain=.beblocky.com`
      : cookieBase;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useThemeContext must be used within a ThemeProvider");
  return ctx;
};
