import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const { labels } = useTheme();

  return (
    <footer id="footerLabel">
      <div>{labels.footer}</div>
      <div style={{ marginTop: 4, opacity: 0.65, fontSize: '0.65rem' }}>
        GESI3 — ENSA de Fès · Promotion 2026/2027
      </div>
    </footer>
  );
}
