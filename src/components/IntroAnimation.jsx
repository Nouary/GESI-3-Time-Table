import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, FileText, Target, Printer, ArrowRight } from 'lucide-react';
import './IntroAnimation.css';

const SEEN_KEY = 'gesi3-intro-seen';
const STEP_MS = 3400;

export function introSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Modules réels de GESI3 Semestre 5
// d = day column (0-5), r = slot row (0-2)
const CELLS = [
  { d: 0, r: 0, name: 'Véhicule Int.', kind: 'ok' },
  { d: 0, r: 1, name: 'Véhicule Élec.', kind: 'ok' },
  { d: 1, r: 0, name: 'Anglais (M355)', kind: 'ok' },
  { d: 1, r: 2, name: 'TP Audit Énerg.', kind: 'cancel', badge: 'Annulé' },
  { d: 2, r: 1, name: 'Smart Grids', kind: 'report', badge: 'Reporté → Sam' },
  { d: 3, r: 0, name: 'Gestion Énergie', kind: 'ok' },
  { d: 4, r: 1, name: 'Confort Thermique', kind: 'ok' },
  { d: 5, r: 0, name: 'Smart Grids', kind: 'makeup', badge: 'Rattrapage' },
  { d: 5, r: 2, name: 'Management', kind: 'ok' },
];

const SCENES = [
  {
    title: 'Ton planning, semaine par semaine',
    text: 'Cours, TD, TP et AP des semaines 1 à 11, pour Gr1 et Gr2.',
  },
  {
    title: 'Toujours à jour en temps réel',
    text: 'Annulations, reports et rattrapages apparaissent dès que le délégué les publie.',
  },
  {
    title: 'Tout le reste au même endroit',
    text: 'Documents de cours, TD, corrections et deadlines de projets sans fouiller WhatsApp.',
  },
  {
    title: 'GESI 3 · ENSA Fès',
    text: 'Accès instantané et direct, sans compte ni inscription requise.',
  },
];

const FEATURES = [
  { Icon: FileText, label: 'Documents', text: 'Cours, TD, corrections et TP classés par matière' },
  { Icon: Target, label: 'Projets', text: 'Deadlines et alertes 48 h avant' },
  { Icon: Printer, label: 'PDF 1-Page', text: 'Impression A4 paysage propre sur 1 page' },
];

export default function IntroAnimation({ onDone }) {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const last = SCENES.length - 1;

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage unavailable */
    }
    setLeaving(true);
    setTimeout(onDone, 400);
  }, [onDone]);

  useEffect(() => {
    if (step >= last) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, last]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && finish();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  const scene = SCENES[step];
  const showGrid = step < 2;

  return (
    <div className={`intro${leaving ? ' is-leaving' : ''}`} role="dialog" aria-label="Présentation de la plateforme GESI3">
      <button className="intro__skip" onClick={finish} title="Passer directement au planning">
        Passer ➔
      </button>

      <div className="intro__stage">
        <div className="intro__visual">
          {showGrid && (
            <div className={`intro__grid${step >= 1 ? ' is-changed' : ''}`} aria-hidden="true">
              {DAYS.map((d) => (
                <span className="intro__day" key={d}>{d}</span>
              ))}
              {Array.from({ length: 18 }, (_, i) => {
                const d = i % 6;
                const r = Math.floor(i / 6);
                const cell = CELLS.find((c) => c.d === d && c.r === r);
                if (!cell) return <span className="intro__slot" key={i} />;
                return (
                  <span
                    className="intro__cell"
                    key={i}
                    data-kind={step >= 1 ? cell.kind : 'ok'}
                    style={{ '--i': i }}
                  >
                    <span className="intro__name">{cell.name}</span>
                    {cell.badge && <span className="intro__badge">{cell.badge}</span>}
                  </span>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <ul className="intro__features">
              {FEATURES.map(({ Icon, label, text }, i) => (
                <li key={label} style={{ '--i': i }}>
                  <Icon size={24} aria-hidden="true" />
                  <strong>{label}</strong>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          )}

          {step === last && (
            <div className="intro__mark">
              <CalendarDays size={64} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="intro__caption" key={step} aria-live="polite">
          <h1>{scene.title}</h1>
          <p>{scene.text}</p>
        </div>

        <div className="intro__footer">
          <div className="intro__dots">
            {SCENES.map((_, i) => (
              <button
                key={i}
                className={i === step ? 'is-on' : ''}
                onClick={() => setStep(i)}
                aria-label={`Étape ${i + 1}`}
              />
            ))}
          </div>
          {step === last && (
            <button className="intro__enter" onClick={finish} autoFocus>
              Accéder au planning <ArrowRight size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
