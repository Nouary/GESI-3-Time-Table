import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const { labels } = useTheme();

  return (
    <footer id="footerLabel" style={{ textAlign: 'center', padding: '24px 16px', borderTop: '1px solid var(--border, rgba(0,0,0,0.1))' }}>
      <div>{labels.footer}</div>
      <div style={{ marginTop: 4, opacity: 0.85, fontSize: '0.75rem', fontWeight: 600 }}>
        GESI3 — ENSA de Fès · Promotion 2026/2027
      </div>
      <div style={{ marginTop: 8, fontSize: '0.72rem', opacity: 0.75, maxWidth: '620px', margin: '8px auto 0', lineHeight: 1.45 }}>
        💡 Ce site a été créé pour aider à organiser la vie étudiante de la classe GESI 3.
        Il s'agit d'un projet personnel (side project) développé avec l'aide de l'IA sur mon temps libre.
      </div>
      <div style={{ marginTop: 6, fontSize: '0.72rem', opacity: 0.85 }}>
        Créé par <strong style={{ color: 'var(--accent)' }}>NOUARY Lhoussaine</strong> · 28 Septembre 2026
      </div>
    </footer>
  );
}
