import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const DIALOG_CONFIG = {
  conflict: {
    icon: null, // SVG below
    accentVar: '#e05a3a',
    labelCode: '[CONFLIT]',
    progressColor: '#e05a3a'
  },
  error: {
    icon: null,
    accentVar: '#e05a3a',
    labelCode: '[ERREUR]',
    progressColor: '#e05a3a'
  },
  success: {
    icon: null,
    accentVar: '#22a06b',
    labelCode: '[OK]',
    progressColor: '#22a06b'
  },
  confirm: {
    icon: null,
    accentVar: '#0284c7',
    labelCode: '[PROMPT]',
    progressColor: '#0284c7'
  },
  info: {
    icon: null,
    accentVar: '#0284c7',
    labelCode: '[INFO]',
    progressColor: '#0284c7'
  }
};

function IconConflict() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 3L25.5 23H2.5L14 3Z" fill="#fef3c7" stroke="#e05a3a" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="13" y="11" width="2" height="7" rx="1" fill="#e05a3a"/>
      <rect x="13" y="20" width="2" height="2" rx="1" fill="#e05a3a"/>
    </svg>
  );
}
function IconError() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="12" fill="#fee2e2" stroke="#e05a3a" strokeWidth="2"/>
      <path d="M9.5 9.5L18.5 18.5M18.5 9.5L9.5 18.5" stroke="#e05a3a" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconSuccess() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="12" fill="#dcfce7" stroke="#22a06b" strokeWidth="2"/>
      <path d="M9 14.5L12.5 18L19 11" stroke="#22a06b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconConfirm() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="12" fill="#dbeafe" stroke="#0284c7" strokeWidth="2"/>
      <rect x="13" y="9" width="2" height="6" rx="1" fill="#0284c7"/>
      <rect x="13" y="17" width="2" height="2" rx="1" fill="#0284c7"/>
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="12" fill="#dbeafe" stroke="#0284c7" strokeWidth="2"/>
      <rect x="13" y="13" width="2" height="6" rx="1" fill="#0284c7"/>
      <rect x="13" y="9" width="2" height="2" rx="1" fill="#0284c7"/>
    </svg>
  );
}

const ICONS = { conflict: <IconConflict />, error: <IconError />, success: <IconSuccess />, confirm: <IconConfirm />, info: <IconInfo /> };

export default function CustomDialog({
  isOpen,
  type = 'info',
  title,
  message,
  details = null,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  showCancel = false
}) {
  const { direction } = useTheme();
  const cfg = DIALOG_CONFIG[type] || DIALOG_CONFIG.info;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape' && onCancel) onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isTerminal = direction === 'terminal';
  const isCorporate = direction === 'corporate';

  return (
    <div className="cdialog-backdrop" onClick={onCancel} role="presentation">
      <div
        className={`cdialog-card cdialog-${type} cdialog-dir-${direction}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cdialog-title"
      >
        {/* Accent bar top */}
        <div className="cdialog-accent-bar" style={{ background: cfg.accentVar }} />

        <div className="cdialog-inner">
          {/* Header */}
          <div className="cdialog-header">
            <span className="cdialog-icon-wrap">
              {ICONS[type] || ICONS.info}
            </span>
            <div className="cdialog-title-block">
              {isTerminal && (
                <span className="cdialog-terminal-label" style={{ color: cfg.accentVar }}>
                  {cfg.labelCode}&nbsp;
                </span>
              )}
              {isCorporate && (
                <span className="cdialog-corp-label" style={{ color: cfg.accentVar }}>
                  {cfg.labelCode}&nbsp;
                </span>
              )}
              <h3 className="cdialog-title" id="cdialog-title">{title}</h3>
            </div>
          </div>

          {/* Divider */}
          <div className="cdialog-divider" />

          {/* Body */}
          <div className="cdialog-body">
            <p className="cdialog-message">{message}</p>

            {details && (
              <div className="cdialog-details">
                {details.moduleName && (
                  <div className="cdialog-detail-row">
                    <span className="cdialog-detail-key">Séance en conflit</span>
                    <span className="cdialog-detail-val cdialog-val-accent" style={{ color: cfg.accentVar }}>
                      {details.moduleCode} — {details.moduleName}
                    </span>
                  </div>
                )}
                {details.time && (
                  <div className="cdialog-detail-row">
                    <span className="cdialog-detail-key">Créneau</span>
                    <span className="cdialog-detail-val">
                      {details.day} · <strong>{details.time}</strong> · Semaine {details.week}
                    </span>
                  </div>
                )}
                {details.group && (
                  <div className="cdialog-detail-row">
                    <span className="cdialog-detail-key">Groupe</span>
                    <span className="cdialog-group-chip">{details.group}</span>
                  </div>
                )}
                {(details.room || details.professor) && (
                  <div className="cdialog-detail-row">
                    <span className="cdialog-detail-key">Lieu / Enseignant</span>
                    <span className="cdialog-detail-val">
                      {details.room || '—'}{details.professor ? ` · Pr. ${details.professor}` : ''}
                    </span>
                  </div>
                )}
                {details.hint && (
                  <div className="cdialog-hint">
                    <span className="cdialog-hint-icon">💡</span>
                    <span>{details.hint}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="cdialog-footer">
            {showCancel && (
              <button type="button" className="cdialog-btn-cancel" onClick={onCancel}>
                {cancelText}
              </button>
            )}
            <button
              type="button"
              className={`cdialog-btn-confirm cdialog-btn-${type}`}
              style={{ '--btn-color': cfg.accentVar }}
              onClick={onConfirm || onCancel}
              autoFocus
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
