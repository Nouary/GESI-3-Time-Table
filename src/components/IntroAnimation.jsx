import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Printer, MousePointer2, ArrowRight, Clock } from 'lucide-react';
import './IntroAnimation.css';

const SEEN_KEY = 'gesi3-intro-seen';
const STEP_MS = 5200; // time per story
const SOLVE_MS = 1900; // chaos -> solution switch inside a story
const SKINS = [['zine', 'Zine'], ['editorial', 'Éditorial'], ['terminal', 'Terminal']];

export function introSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

/* ---------- 1 & 2 : timetable (absolute cells so they can glide) ---------- */
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Modules réels GESI 3 (Semestre 5 ENSA Fès). c = column (0-5), r = row (0-2)
const CELLS = [
  { id: 'a', name: 'Véhicule Int.', c: 0, r: 0 },
  { id: 'b', name: 'Véhicule Élec.', c: 0, r: 1 },
  { id: 'c', name: 'Smart Grids', c: 1, r: 0 },
  { id: 'd', name: 'TP Audit Énerg.', c: 1, r: 2, live: { kind: 'cancel', badge: 'Annulé' } },
  { id: 'e', name: 'Gestion Énergie', c: 2, r: 1, live: { kind: 'report', badge: 'Reporté', c: 5, r: 1 } },
  { id: 'f', name: 'TD Confort Therm.', c: 3, r: 0 },
  { id: 'g', name: 'Anglais (M355)', c: 4, r: 1 },
  { id: 'h', name: 'Management', c: 5, r: 2 },
  { id: 'i', name: 'Gestion Énergie', c: 3, r: 2, late: true, live: { kind: 'makeup', badge: 'Rattrapage' } },
];

function Timetable({ mode, solved }) {
  return (
    <div className="tt" aria-hidden="true">
      <div className="tt__days">{DAYS.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="tt__body">
        {CELLS.map((cell, i) => {
          const live = mode === 'live' && solved && cell.live;
          const pos = live && cell.live.c !== undefined ? cell.live : cell;
          const shown = mode === 'build' ? solved : !cell.late || solved;
          return (
            <div
              key={cell.id}
              className={`tt__cell${shown ? ' is-shown' : ''}`}
              data-kind={live ? cell.live.kind : 'ok'}
              style={{ '--c': pos.c, '--r': pos.r, '--i': i }}
            >
              <div className="tt__box">
                <span className="tt__name">{cell.name}</span>
                {live && <span className="tt__badge">{cell.live.badge}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CHAT = [
  { t: 'prof absent ??', x: 4, y: 6, r: -6 },
  { t: 'c’est quelle salle ?', x: 50, y: 0, r: 4 },
  { t: 'qqn a le TD3 ?', x: 68, y: 34, r: -3 },
  { t: 'lien Drive expiré', x: 2, y: 50, r: 5 },
  { t: 'rapport pour quand ??', x: 34, y: 68, r: -4 },
  { t: 'TP annulé ou pas ?', x: 60, y: 82, r: 3 },
];

function Chaos({ solved }) {
  return (
    <div className="chaos" aria-hidden="true">
      {CHAT.map(({ t, x, y, r }, i) => (
        <span
          key={t}
          className={`bub${solved ? ' is-gone' : ''}`}
          style={{ '--x': x, '--y': y, '--r': r, '--dx': 50 - x, '--dy': 45 - y, '--i': i }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function Live({ solved }) {
  return (
    <div className="live">
      <div className="live__bar">
        <span>Délégué</span>
        <span className={`live__btn${solved ? ' is-done' : ''}`}>{solved ? 'Publié' : 'Publier'}</span>
      </div>
      <Timetable mode="live" solved={solved} />
      <MousePointer2 className="live__cursor" size={22} aria-hidden="true" />
    </div>
  );
}

/* ---------- 3 : documents fly into place ---------- */
const SUBJECTS = ['Smart Grids', 'Véhicules Élec.', 'Audit Énerg.'];
const DOCS = [
  { col: 0, type: 'Cours', dx: 120, dy: -30, rot: -10, dead: true },
  { col: 0, type: 'TD', dx: 60, dy: 70, rot: 8 },
  { col: 1, type: 'Cours', dx: -80, dy: 50, rot: 6 },
  { col: 1, type: 'Correction', dx: 40, dy: -60, rot: -7, dead: true },
  { col: 2, type: 'TP', dx: -130, dy: 20, rot: 9 },
  { col: 2, type: 'Cours', dx: -50, dy: 80, rot: -5 },
];

function Docs({ solved }) {
  return (
    <div className={`docs${solved ? ' is-solved' : ''}`} aria-hidden="true">
      {SUBJECTS.map((subject, col) => (
        <div className="docs__col" key={subject}>
          <h3>{subject}</h3>
          {DOCS.map((d, i) =>
            d.col === col ? (
              <div
                key={i}
                className={`chip${d.dead && !solved ? ' is-dead' : ''}`}
                style={{ '--dx': `${d.dx}px`, '--dy': `${d.dy}px`, '--rot': `${d.rot}deg`, '--i': i }}
              >
                <FileText size={16} />
                <span>{d.type}</span>
                {d.dead && !solved && <em>lien expiré</em>}
              </div>
            ) : null
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- 4 : live countdown ---------- */
const pad = (n) => String(n).padStart(2, '0');
const NOTES = [
  { t: 'rapport ?? c’est quand', x: 6, y: 10, r: -7 },
  { t: 'TP à rendre lundi ?', x: 58, y: 4, r: 5 },
  { t: 'deadline floue…', x: 30, y: 62, r: -3 },
];

function Deadline({ solved }) {
  const [sec, setSec] = useState(47 * 3600 + 59 * 60 + 40);
  useEffect(() => {
    if (!solved) return;
    const t = setInterval(() => setSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [solved]);
  return (
    <div className={`dl${solved ? ' is-solved' : ''}`} aria-hidden="true">
      <div className="dl__ring">
        <svg viewBox="0 0 120 120">
          <circle className="dl__track" cx="60" cy="60" r="54" />
          <circle className="dl__arc" cx="60" cy="60" r="54" />
        </svg>
        <div className="dl__time">
          <Clock size={16} />
          <strong>{pad(Math.floor(sec / 3600))}:{pad(Math.floor((sec % 3600) / 60))}:{pad(sec % 60)}</strong>
        </div>
      </div>
      <div className="dl__card">
        <b>Rapport de projet</b>
        <span>Efficacité & Audit Énergétique</span>
        <em>Moins de 48 h</em>
      </div>
      {NOTES.map(({ t, x, y, r }) => (
        <span key={t} className="dl__note" style={{ '--x': x, '--y': y, '--r': r }}>{t}</span>
      ))}
    </div>
  );
}

/* ---------- 5 : one-page PDF prints out ---------- */
function Pdf({ solved }) {
  return (
    <div className={`pdf${solved ? ' is-out' : ''}`} aria-hidden="true">
      <div className="pdf__bar">
        <Printer size={18} />
        <span>{solved ? 'PDF prêt' : 'Exporter en PDF'}</span>
      </div>
      <div className="pdf__sheet">
        <div className="pdf__head"><b>Planning · Semaine 4</b><span>GESI 3 · ENSA Fès</span></div>
        <div className="pdf__grid">
          {Array.from({ length: 18 }, (_, i) => <i key={i} className={[1, 4, 7, 9, 12, 14, 16].includes(i) ? 'on' : ''} />)}
        </div>
        <div className="pdf__notes"><span /><span /></div>
        <span className="pdf__stamp">1 page</span>
      </div>
    </div>
  );
}

/* ---------- 6 : the whole page re-skins ---------- */
function Finale({ skin }) {
  return (
    <div className="fin" aria-hidden="true">
      <Timetable mode="live" solved />
      <div className="fin__skins">
        {SKINS.map(([k, label], i) => <span key={k} className={i === skin ? 'is-on' : ''}>{label}</span>)}
      </div>
    </div>
  );
}

const SCENES = [
  {
    title: 'Fini le chaos des groupes WhatsApp',
    text: 'Un seul planning pour toute la classe, semaines 1 à 11.',
    Body: ({ solved }) => (
      <div className="vis"><Timetable mode="build" solved={solved} /><Chaos solved={solved} /></div>
    ),
  },
  {
    title: 'Le délégué publie, tout le monde voit',
    text: 'Annulations, reports et rattrapages apparaissent aussitôt. Les conflits de créneau sont détectés.',
    Body: ({ solved }) => <Live solved={solved} />,
  },
  {
    title: 'Chaque document à sa place',
    text: 'Cours, TD, corrections, TP : classés par matière, un clic pour télécharger.',
    Body: ({ solved }) => <Docs solved={solved} />,
  },
  {
    title: 'Les deadlines ne te surprennent plus',
    text: 'Compte à rebours sur chaque projet, alerte quand il reste moins de 48 h.',
    Body: ({ solved }) => <Deadline solved={solved} />,
  },
  {
    title: 'Ton planning en 1 page A4',
    text: 'Un clic sur PDF : du lundi au samedi, notes de la semaine comprises.',
    Body: ({ solved }) => <Pdf solved={solved} />,
  },
  {
    title: 'À ton style, sans inscription',
    text: '3 styles, clair ou sombre. Aucun compte à créer.',
    Body: ({ skin }) => <Finale skin={skin} />,
  },
];

export default function IntroAnimation({ onDone }) {
  const [step, setStep] = useState(0);
  const [solvedAt, setSolvedAt] = useState(-1);
  const [skin, setSkin] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const last = SCENES.length - 1;
  const solved = solvedAt === step;

  const finish = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage unavailable: intro will just show again */
    }
    setLeaving(true);
    setTimeout(onDone, 400);
  }, [onDone]);

  useEffect(() => {
    const t = setTimeout(() => setSolvedAt(step), SOLVE_MS);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step >= last) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, last]);

  useEffect(() => {
    if (step !== last) return;
    const t = setInterval(() => setSkin((s) => (s + 1) % SKINS.length), 1300);
    return () => clearInterval(t);
  }, [step, last]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && finish();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  const go = (d) => setStep((s) => Math.min(last, Math.max(0, s + d)));
  const { title, text, Body } = SCENES[step];

  return (
    <div
      className={`intro${leaving ? ' is-leaving' : ''}`}
      data-skin={step === last ? SKINS[skin][0] : undefined}
      style={{ '--step': `${STEP_MS}ms` }}
      role="dialog"
      aria-label="Présentation du site"
    >
      <div className="intro__bars" aria-hidden="true">
        {SCENES.map((_, i) => (
          <span key={i} className={`intro__bar${i < step || (i === step && step === last) ? ' is-done' : i === step ? ' is-now' : ''}`}>
            <i key={i === step ? step : 'x'} />
          </span>
        ))}
      </div>
      <button className="intro__skip" onClick={finish}>Passer</button>

      <button className="intro__tap intro__tap--prev" onClick={() => go(-1)} aria-label="Étape précédente" />
      <button className="intro__tap intro__tap--next" onClick={() => go(1)} aria-label="Étape suivante" />

      <div className="intro__stage">
        <div className="intro__visual"><Body solved={solved} skin={skin} /></div>
        <div className="intro__caption" key={step} aria-live="polite">
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
        <div className="intro__footer">
          {step === last && (
            <button className="intro__enter" onClick={finish} autoFocus>
              Voir le planning <ArrowRight size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
