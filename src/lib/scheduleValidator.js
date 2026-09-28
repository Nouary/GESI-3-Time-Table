// Utilitaire de validation des conflits d'emploi du temps

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

function isTimeOverlapping(startA, endA, startB, endB) {
  const a1 = timeToMinutes(startA);
  const a2 = timeToMinutes(endA);
  const b1 = timeToMinutes(startB);
  const b2 = timeToMinutes(endB);
  return a1 < b2 && a2 > b1;
}

function isExactSameSlot(startA, endA, startB, endB) {
  return (
    timeToMinutes(startA) === timeToMinutes(startB) &&
    timeToMinutes(endA) === timeToMinutes(endB)
  );
}

function hasGroupConflict(groupA, groupB) {
  // null = toute la promotion
  if (!groupA || !groupB) return true;
  // Gr1 vs Gr1 ou Gr2 vs Gr2 = conflit
  return groupA.toLowerCase() === groupB.toLowerCase();
}

/**
 * Vérifie si la programmation d'un rattrapage entre en conflit avec une séance existante.
 *
 * Cas spécial : si le créneau est EXACTEMENT identique (même heure début, fin, jour, même groupe)
 * on retourne un type de conflit "exact_duplicate" avec un message dédié.
 */
export function checkScheduleConflict({
  targetSession,
  newWeek,
  newDay,
  newStartTime,
  newEndTime,
  allSessions,
  allReports,
  modulesMap = {}
}) {
  const targetGroup = targetSession?.student_group || null;

  // ─────────────────────────────────────────────────────────────
  // 1. Vérification contre les séances régulières
  // ─────────────────────────────────────────────────────────────
  for (const session of allSessions) {
    if (session.day.toLowerCase() !== newDay.toLowerCase()) continue;
    if (newWeek < session.week_from || newWeek > session.week_to) continue;

    // Ignorer si c'est la même séance déplacée vers elle-même
    if (session.id === targetSession?.id && session.day === targetSession?.day) continue;

    // Vérifier si cette séance est annulée / déjà déplacée cette semaine-là
    const activeReport = allReports.find(
      (r) => r.original_session_id === session.id && Number(r.original_week) === Number(newWeek)
    );
    if (activeReport) continue;

    // Chevauchement horaire
    if (isTimeOverlapping(newStartTime, newEndTime, session.start_time, session.end_time)) {
      if (hasGroupConflict(targetGroup, session.student_group)) {
        const isDuplicate = isExactSameSlot(newStartTime, newEndTime, session.start_time, session.end_time);
        return {
          hasConflict: true,
          isDuplicateSlot: isDuplicate,
          conflictingSession: {
            moduleCode: session.module_code,
            moduleName: modulesMap[session.module_code] || session.module_code,
            day: session.day,
            week: newWeek,
            time: `${session.start_time} – ${session.end_time}`,
            group: session.student_group ? `Groupe ${session.student_group}` : 'Toute la promotion',
            room: session.room,
            professor: session.professor,
            hint: isDuplicate
              ? 'Ce créneau est identique (même heure de début, même heure de fin, même jour, même groupe) à un cours déjà programmé. Le rattrapage doit être placé sur un créneau différent.'
              : 'Ce créneau chevauche un cours déjà programmé pour ce groupe. Veuillez choisir un autre horaire ou une autre semaine.'
          }
        };
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Vérification contre les autres rattrapages déjà injectés
  // ─────────────────────────────────────────────────────────────
  for (const report of allReports) {
    if (report.status !== 'reported') continue;
    if (Number(report.new_week) !== Number(newWeek)) continue;
    if (report.new_day.toLowerCase() !== newDay.toLowerCase()) continue;

    const originSession = allSessions.find((s) => s.id === report.original_session_id);
    const makeupGroup = originSession ? originSession.student_group : null;
    const makeupStart = report.new_start_time || (originSession ? originSession.start_time : '08:30');
    const makeupEnd = report.new_end_time || (originSession ? originSession.end_time : '12:30');

    if (isTimeOverlapping(newStartTime, newEndTime, makeupStart, makeupEnd)) {
      if (hasGroupConflict(targetGroup, makeupGroup)) {
        const isDuplicate = isExactSameSlot(newStartTime, newEndTime, makeupStart, makeupEnd);
        return {
          hasConflict: true,
          isDuplicateSlot: isDuplicate,
          conflictingSession: {
            moduleCode: originSession ? originSession.module_code : 'Rattrapage',
            moduleName: originSession ? (modulesMap[originSession.module_code] || originSession.module_code) : 'Séance reportée',
            day: report.new_day,
            week: newWeek,
            time: `${makeupStart} – ${makeupEnd}`,
            group: makeupGroup ? `Groupe ${makeupGroup}` : 'Toute la promotion',
            room: report.new_room || (originSession ? originSession.room : null),
            professor: originSession ? originSession.professor : null,
            hint: isDuplicate
              ? 'Un rattrapage est déjà programmé sur ce créneau exact (même heure de début, fin, jour, même groupe). Impossible de créer un doublon.'
              : 'Un autre cours de rattrapage chevauche ce créneau pour ce groupe.'
          }
        };
      }
    }
  }

  return { hasConflict: false, isDuplicateSlot: false };
}
