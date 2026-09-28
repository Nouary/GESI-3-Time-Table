import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ControlsDock() {
  const { direction, setDirection, mode, toggleTheme } = useTheme();

  return (
    <aside id="controls" aria-label="Paramètres d'affichage">
      <div className="dock">
        <div className="dock-label">Style</div>

        <button
          type="button"
          className={`dir-btn ${direction === 'corporate' ? 'active' : ''}`}
          onClick={() => setDirection('corporate')}
          title="Académique & Entreprise — Style corporate épuré, idéal pour l'impression PDF"
        >
          <span className="ic">Cp</span>
          <span className="lbl">Corporate</span>
        </button>

        <button
          type="button"
          className={`dir-btn ${direction === 'editorial' ? 'active' : ''}`}
          onClick={() => setDirection('editorial')}
          title="Éditorial Technique — Lignes épurées et sobres"
        >
          <span className="ic">Éd</span>
          <span className="lbl">Éditorial</span>
        </button>

        <button
          type="button"
          className={`dir-btn ${direction === 'terminal' ? 'active' : ''}`}
          onClick={() => setDirection('terminal')}
          title="Terminal / Blueprint — Style console et monospace"
        >
          <span className="ic">Tm</span>
          <span className="lbl">Terminal</span>
        </button>

        <button
          type="button"
          className={`dir-btn ${direction === 'zine' ? 'active' : ''}`}
          onClick={() => setDirection('zine')}
          title="Zine Étudiant — Ambiance post-its et washi tape"
        >
          <span className="ic">Zn</span>
          <span className="lbl">Zine</span>
        </button>

        <div className="dock-divider" />

        <button
          type="button"
          id="themeToggle"
          onClick={toggleTheme}
          title={mode === 'dark' ? 'Basculer en mode clair' : 'Basculer en mode sombre'}
        >
          <span>{mode === 'dark' ? '☀️' : '🌙'}</span>
          <span className="lbl">Thème</span>
        </button>
      </div>
    </aside>
  );
}
