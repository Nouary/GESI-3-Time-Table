import React from 'react';
import WeekStrip from './WeekStrip';
import { useTheme } from '../context/ThemeContext';

const DAYS = [
  { id: 'lundi', label: 'Lundi' },
  { id: 'mardi', label: 'Mardi' },
  { id: 'mercredi', label: 'Mercredi' },
  { id: 'jeudi', label: 'Jeudi' },
  { id: 'vendredi', label: 'Vendredi' },
  { id: 'samedi', label: 'Samedi' }
];

const WASHI_COLORS = [
  'rgba(224, 85, 60, 0.55)',
  'rgba(92, 138, 90, 0.55)',
  'rgba(77, 126, 168, 0.55)',
  'rgba(202, 142, 60, 0.55)',
  'rgba(142, 90, 180, 0.55)'
];

const TYPE_LABELS = {
  cours: 'Cours',
  td: 'TD',
  cours_td: 'Cours + TD',
  tp: 'TP',
  ap: 'Activité Pratique'
};

/**
 * Déclenche l'impression PDF du planning de la semaine.
 * La feuille de style @media print du CSS gère la mise en page.
 */
function handlePrintWeek(week) {
  const prevTitle = document.title;
  document.title = `Planning GESI3 — Semaine ${week}`;
  window.print();
  // Restore after a tick
  setTimeout(() => { document.title = prevTitle; }, 500);
}

export default function PlanningView({
  week,
  onPrevWeek,
  onNextWeek,
  sessions,
  reports,
  modules,
  projects = [],
  notes = []
}) {
  const { direction } = useTheme();

  // Map pour retrouver rapidement le module
  const modulesMap = React.useMemo(() => {
    const map = {};
    modules.forEach(m => {
      map[m.module_code] = m.name;
    });
    return map;
  }, [modules]);

  // Map pour retrouver la session d'origine
  const sessionsMap = React.useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [sessions]);

  // Calcul automatique des notes et événements clés de cette semaine
  const weekNotes = React.useMemo(() => {
    const calculatedNotes = [];
    const SEMESTER_START = new Date('2026-09-14T00:00:00');
    const weekStartDate = new Date(SEMESTER_START.getTime() + (week - 1) * 7 * 86400000);
    const weekEndDate = new Date(weekStartDate.getTime() + 6 * 86400000);

    // 1. Projets / Devoirs à rendre cette semaine
    projects.forEach(p => {
      if (!p.due_date) return;
      const dueDate = new Date(p.due_date + 'T00:00:00');
      if (dueDate >= weekStartDate && dueDate <= weekEndDate) {
        const dStr = dueDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
        calculatedNotes.push({
          type: 'deadline',
          badge: 'À Rendre',
          text: `${p.title} (${p.module_code}) — Échéance : ${dStr} à ${p.due_time || '23:59'}${p.professor ? ` (Pr. ${p.professor})` : ''}`
        });
      }
    });

    // 2. Séances annulées cette semaine
    const cancellations = reports.filter(r => r.status === 'cancelled' && Number(r.original_week) === week);
    cancellations.forEach(r => {
      const orig = sessionsMap[r.original_session_id];
      const mName = orig ? (modulesMap[orig.module_code] || orig.module_code) : 'Séance';
      const day = orig?.day || 'ce jour';
      calculatedNotes.push({
        type: 'cancelled',
        badge: 'Annulation',
        text: `Séance de ${mName} (${day.toUpperCase()} ${orig?.start_time || ''}) annulée.${r.note ? ` Motif : ${r.note}` : ''}`
      });
    });

    // 3. Séances reportées depuis cette semaine vers une autre
    const reportedOut = reports.filter(r => r.status === 'reported' && Number(r.original_week) === week);
    reportedOut.forEach(r => {
      const orig = sessionsMap[r.original_session_id];
      const mName = orig ? (modulesMap[orig.module_code] || orig.module_code) : 'Séance';
      calculatedNotes.push({
        type: 'reported',
        badge: 'Reportée',
        text: `Séance de ${mName} décalée vers la Semaine ${r.new_week}${r.new_day ? ` (${r.new_day} à ${r.new_start_time || ''})` : ''}.${r.note ? ` Note : ${r.note}` : ''}`
      });
    });

    // 4. Séances de rattrapage programmées cette semaine
    const makeupThisWeek = reports.filter(r => r.status === 'reported' && Number(r.new_week) === week);
    makeupThisWeek.forEach(r => {
      const orig = sessionsMap[r.original_session_id];
      const mName = orig ? (modulesMap[orig.module_code] || orig.module_code) : 'Séance';
      calculatedNotes.push({
        type: 'makeup',
        badge: 'Rattrapage',
        text: `Rattrapage programmé : ${mName} le ${r.new_day ? r.new_day.toUpperCase() : ''} (${r.new_start_time || ''} – ${r.new_end_time || ''}) en ${r.new_room || orig?.room || 'Salle à définir'}.`
      });
    });

    // 5. Notes enregistrées pour cette semaine (ajouts de séances, annonces, alertes)
    const currentWeekNotes = (notes || []).filter(n => Number(n.week) === week);
    currentWeekNotes.forEach(n => {
      let badge = 'Information';
      if (n.type === 'added') badge = 'Séance Ajoutée';
      else if (n.type === 'warning') badge = 'Attention';
      else if (n.type === 'success') badge = 'Important';
      else if (n.type === 'deadline') badge = 'Échéance';

      calculatedNotes.push({
        type: n.type || 'info',
        badge,
        text: n.text
      });
    });

    return calculatedNotes;
  }, [week, projects, reports, sessionsMap, modulesMap, notes]);

  return (
    <div className="planning-view">
      <WeekStrip week={week} onPrev={onPrevWeek} onNext={onNextWeek} />

      {DAYS.map(day => {
        // 1. Séances régulières de la semaine
        const regularSessions = sessions.filter(
          s => s.day === day.id && week >= s.week_from && week <= s.week_to
        );

        // 2. Séances de rattrapage (reports vers cette semaine et ce jour)
        const makeupReports = reports.filter(
          r => r.status === 'reported' && Number(r.new_week) === week && r.new_day === day.id
        );

        // Construire la liste unifiée des éléments du jour
        const dayItems = [];

        regularSessions.forEach(s => {
          const report = reports.find(
            r => r.original_session_id === s.id && Number(r.original_week) === week
          );

          dayItems.push({
            id: s.id,
            type: 'regular',
            startTime: s.start_time,
            endTime: s.end_time,
            moduleCode: s.module_code,
            moduleName: modulesMap[s.module_code] || s.module_code,
            sessionType: s.session_type,
            room: s.room,
            professor: s.professor,
            studentGroup: s.student_group,
            report: report || null
          });
        });

        makeupReports.forEach(r => {
          const original = sessionsMap[r.original_session_id];
          dayItems.push({
            id: r.id,
            type: 'makeup',
            startTime: r.new_start_time || (original ? original.start_time : '08:30'),
            endTime: r.new_end_time || (original ? original.end_time : '12:30'),
            moduleCode: original ? original.module_code : 'Module',
            moduleName: original ? (modulesMap[original.module_code] || original.module_code) : 'Rattrapage',
            sessionType: original ? original.session_type : 'cours',
            room: r.new_room || (original ? original.room : null),
            professor: original ? original.professor : null,
            studentGroup: original ? original.student_group : null,
            makeupInfo: r
          });
        });

        // Trier chronologiquement
        dayItems.sort((a, b) => a.startTime.localeCompare(b.startTime));

        return (
          <section key={day.id} className="day-section">
            <h2 className="day-title">{day.label}</h2>

            {dayItems.length === 0 ? (
              <div className="empty-day">Pas de cours programmé ce jour-là</div>
            ) : (
              dayItems.map((item, index) => {
                const isTiltLeft = index % 2 === 0;
                const washiColor = WASHI_COLORS[index % WASHI_COLORS.length];
                const report = item.report;
                const isCancelled = report?.status === 'cancelled';
                const isReported = report?.status === 'reported';
                const isMakeup = item.type === 'makeup';

                return (
                  <article
                    key={item.id}
                    className={`sticky-card ${isTiltLeft ? 'tilt-left' : 'tilt-right'} ${isCancelled ? 'is-cancelled' : ''
                      } ${isReported ? 'is-reported' : ''} ${isMakeup ? 'is-makeup' : ''}`}
                  >
                    {direction !== 'corporate' && direction !== 'editorial' && (
                      <div className="washi-tape" style={{ background: washiColor }} />
                    )}

                    <div className="card-meta">
                      <span>{item.startTime} – {item.endTime}</span>
                      {item.room && <span>· {item.room}</span>}
                      {item.professor && <span>· Pr. {item.professor}</span>}
                    </div>

                    <div className="course-title">
                      {item.moduleName}
                      {item.studentGroup && (
                        <span className="group-badge">{item.studentGroup}</span>
                      )}
                    </div>

                    <div className="card-details">
                      <span className="tag-badge" style={{ background: 'var(--accent2)' }}>
                        {TYPE_LABELS[item.sessionType] || item.sessionType}
                      </span>

                      {/* Badge Annulation */}
                      {isCancelled && (
                        <span className="tag-badge" style={{ background: '#e0553c' }}>
                          🚫 Séance Annulée
                        </span>
                      )}

                      {/* Badge Report */}
                      {isReported && (
                        <span className="tag-badge" style={{ background: 'var(--accent)' }}>
                          🗓️ Reporté {report.new_week ? `en Semaine ${report.new_week}` : ''}
                          {report.new_day ? ` (${report.new_day})` : ''}
                        </span>
                      )}

                      {/* Badge Rattrapage */}
                      {isMakeup && (
                        <span className="tag-badge" style={{ background: 'var(--accent)' }}>
                          ⚡ Rattrapage (Séance de la Semaine {item.makeupInfo.original_week})
                        </span>
                      )}
                    </div>

                    {/* Commentaire éventuel */}
                    {(report?.note || item.makeupInfo?.note) && (
                      <div style={{ fontSize: '0.75rem', opacity: 0.8, fontStyle: 'italic', marginTop: 4 }}>
                        💬 {report?.note || item.makeupInfo?.note}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        );
      })}

      {/* SECTION NOTES DE LA SEMAINE (Visible sur le site et dans le PDF imprimé) */}
      <div className="week-notes-card">
        <div className="week-notes-header">
          <span className="week-notes-icon">📌</span>
          <h3 className="week-notes-title">Notes & Événements Importants — Semaine {week}</h3>
        </div>

        {weekNotes.length === 0 ? (
          <div className="week-notes-empty">
            Aucun rattrapage, annulation ou échéance critique signalée cette semaine. Emploi du temps régulier.
          </div>
        ) : (
          <ul className="week-notes-list">
            {weekNotes.map((note, idx) => (
              <li key={idx} className={`week-note-item note-${note.type}`}>
                <span className={`wn-badge wn-badge-${note.type}`}>{note.badge}</span>
                <span className="wn-text">{note.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
