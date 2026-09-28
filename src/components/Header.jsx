import React from 'react';

export default function Header({ week }) {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = `Planning GESI3 — Semaine ${week}`;
    window.print();
    setTimeout(() => { document.title = prevTitle; }, 500);
  };

  return (
    <header className="site-header">
      <div className="logo-container">
        <span className="logo">GESI3</span>
      </div>
      <div className="sub">ENSA FÈS · S5 · 2026/2027</div>
      <div className="header-actions">
        <div className="stamp">
          <span>{today}</span>
          <span>·</span>
          <span>Semaine {week}</span>
        </div>
        <button
          type="button"
          className="header-pdf-btn"
          onClick={handlePrint}
          title="Télécharger / Imprimer en PDF"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M8 1v9M8 10l-3-3M8 10l3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="2" y="11" width="12" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          PDF
        </button>
      </div>
    </header>
  );
}
