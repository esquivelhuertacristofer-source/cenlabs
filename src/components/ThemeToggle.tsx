"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 rounded-full border border-dash-border bg-dash-card p-1">
        <div className="h-8 w-8" />
        <div className="h-8 w-8" />
        <div className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 dark:border-dash-border dark:bg-dash-card">
      <button
        onClick={(e) => { e.preventDefault(); setTheme("light"); }}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
          theme === "light"
            ? "bg-amber-100 text-amber-600"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        }`}
        title="Modo claro"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); setTheme("dark"); }}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
          theme === "dark"
            ? "bg-violet-600/20 text-violet-400"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        }`}
        title="Modo oscuro"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); setTheme("system"); }}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
          theme === "system"
            ? "bg-blue-100 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        }`}
        title="Sistema"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
