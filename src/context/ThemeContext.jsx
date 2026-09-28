import React, { createContext, useContext, useState, useEffect } from 'react';

export const PALETTES = {
  zine: {
    light: { paper: '#fff7e8', card: '#ffffff', ink: '#241b12', accent: '#e0553c', accent2: '#5c8a5a', shadow: 'rgba(36,27,18,.9)' },
    dark:  { paper: '#1b140d', card: '#2a2018', ink: '#f3e9d5', accent: '#ff8266', accent2: '#8fc088', shadow: 'rgba(0,0,0,.55)' }
  },
  editorial: {
    light: { paper: '#f3efe6', card: '#fffdf9', ink: '#1a1a17', accent: '#b23b2e', accent2: '#5c6b4a', shadow: 'rgba(26,26,23,.85)' },
    dark:  { paper: '#17150f', card: '#211f19', ink: '#f0ece0', accent: '#e2685a', accent2: '#8aa06e', shadow: 'rgba(0,0,0,.6)' }
  },
  terminal: {
    light: { paper: '#eef2f0', card: '#ffffff', ink: '#0c2b22', accent: '#1f8f6b', accent2: '#2f6fed', shadow: 'rgba(12,43,34,.8)' },
    dark:  { paper: '#081014', card: '#0f1c18', ink: '#c9f5e0', accent: '#4fd6a8', accent2: '#7bb0df', shadow: 'rgba(0,0,0,.6)' }
  },
  corporate: {
    light: { paper: '#f1f5f9', card: '#ffffff', ink: '#0f172a', accent: '#0284c7', accent2: '#0369a1', shadow: 'rgba(15, 23, 42, 0.1)' },
    dark:  { paper: '#090d16', card: '#131b2e', ink: '#f8fafc', accent: '#38bdf8', accent2: '#7dd3fc', shadow: 'rgba(0, 0, 0, 0.5)' }
  }
};

export const DIRECTION_LABELS = {
  zine: {
    name: 'Zine Étudiant',
    planning: '📌 Planning',
    projects: '🎯 Projets',
    docs: '📎 Documents',
    admin: '⚙️ Admin',
    footer: 'Direction visuelle : "Zine Étudiant" (Post-its, washi tape & ambiance promo)'
  },
  editorial: {
    name: 'Éditorial Technique',
    planning: '01 — Planning',
    projects: '02 — Projets',
    docs: '03 — Documents',
    admin: '04 — Admin',
    footer: 'Direction visuelle : "Éditorial Technique" (Revue & lignes sobres)'
  },
  terminal: {
    name: 'Terminal / Blueprint',
    planning: '> planning',
    projects: '> projects',
    docs: '> docs',
    admin: '> admin',
    footer: 'Direction visuelle : "Terminal / Blueprint" (Console & ingénierie)'
  },
  corporate: {
    name: 'Académique & Entreprise',
    planning: '📅 Planning',
    projects: '📋 Projets',
    docs: '📁 Documents',
    admin: '🔒 Administration',
    footer: 'Direction visuelle : "Académique & Entreprise" (Standard corporatif, clean & optimisé PDF)'
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [direction, setDirection] = useState(() => {
    return localStorage.getItem('gesi3_direction') || 'zine';
  });

  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('gesi3_mode');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const palette = PALETTES[direction]?.[mode] || PALETTES.zine.light;

    root.style.setProperty('--paper', palette.paper);
    root.style.setProperty('--card', palette.card);
    root.style.setProperty('--ink', palette.ink);
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent2', palette.accent2);
    root.style.setProperty('--shadow', palette.shadow);

    if (direction === 'terminal') {
      root.style.setProperty('--font-head', "'Courier New', Courier, monospace");
    } else if (direction === 'corporate') {
      root.style.setProperty('--font-head', "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif");
    } else {
      root.style.setProperty('--font-head', "Georgia, Cambria, 'Times New Roman', Times, serif");
    }

    body.setAttribute('data-direction', direction);
    body.setAttribute('data-theme', mode);

    localStorage.setItem('gesi3_direction', direction);
    localStorage.setItem('gesi3_mode', mode);
  }, [direction, mode]);

  const toggleTheme = () => {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        direction,
        setDirection,
        mode,
        setMode,
        toggleTheme,
        labels: DIRECTION_LABELS[direction] || DIRECTION_LABELS.zine
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
