import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import CustomDialog from './CustomDialog';
import { checkScheduleConflict } from '../lib/scheduleValidator';

const DAYS = [
  { id: 'lundi', label: 'Lundi' },
  { id: 'mardi', label: 'Mardi' },
  { id: 'mercredi', label: 'Mercredi' },
  { id: 'jeudi', label: 'Jeudi' },
  { id: 'vendredi', label: 'Vendredi' },
  { id: 'samedi', label: 'Samedi' }
];

export default function AdminView({
  adminUser,
  onLogin,
  onLogout,
  sessions,
  reports,
  documents,
  projects = [],
  notes = [],
  modules,
  onAddSession,
  onDeleteSession,
  onAddReport,
  onDeleteReport,
  onUploadDocument,
  onDeleteDocument,
  onAddProject,
  onDeleteProject,
  onAddNote,
  onDeleteNote
}) {
  // Project form state
  const [projModuleCode, setProjModuleCode] = useState(modules[0]?.module_code || 'M351');
  const [projTitle, setProjTitle] = useState('');
  const [projProfessor, setProjProfessor] = useState('');
  const [projDueDate, setProjDueDate] = useState('');
  const [projDueTime, setProjDueTime] = useState('23:59');
  const [projDescription, setProjDescription] = useState('');
  const [projDocId, setProjDocId] = useState('');
  const [isSubmittingProj, setIsSubmittingProj] = useState(false);
  // Login form state
  const [email, setEmail] = useState('admin@gesi3.ensa');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Report form state
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [originalWeek, setOriginalWeek] = useState(3);
  const [actionType, setActionType] = useState('reported'); // 'reported' or 'cancelled'
  const [newWeek, setNewWeek] = useState(4);
  const [newDay, setNewDay] = useState('lundi');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('08:30');
  const [newEndTime, setNewEndTime] = useState('12:30');
  const [newRoom, setNewRoom] = useState('');
  const [note, setNote] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Document upload state
  const [docModuleCode, setDocModuleCode] = useState(modules[0]?.module_code || 'M351');
  const [docTag, setDocTag] = useState('cours');
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // ── NEW SESSION form state ──
  const [sesModuleCode, setSesModuleCode] = useState(modules[0]?.module_code || 'M351');
  const [sesSessionType, setSesSessionType] = useState('cours');
  const [sesDay, setSesDay] = useState('lundi');
  const [sesStartTime, setSesStartTime] = useState('08:30');
  const [sesEndTime, setSesEndTime] = useState('10:30');
  const [sesWeekFrom, setSesWeekFrom] = useState(1);
  const [sesWeekTo, setSesWeekTo] = useState(11);
  const [sesRoom, setSesRoom] = useState('');
  const [sesProfessor, setSesProfessor] = useState('');
  const [sesStudentGroup, setSesStudentGroup] = useState('');
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  // ── NOTES form state ──
  const [noteWeek, setNoteWeek] = useState(1);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('info');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Configuration du dialogue / popup personnalisé
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    details: null,
    confirmText: 'D\'accord',
    cancelText: 'Annuler',
    showCancel: false,
    onConfirm: null,
    onCancel: null
  });

  const closeDialog = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Map des modules pour l'affichage des noms complets
  const modulesMap = React.useMemo(() => {
    const map = {};
    modules.forEach(m => {
      map[m.module_code] = m.name;
    });
    return map;
  }, [modules]);

  // Initialisation auto de la première session
  React.useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
      setNewStartTime(sessions[0].start_time);
      setNewEndTime(sessions[0].end_time);
      setNewRoom(sessions[0].room || '');
      setNewDay(sessions[0].day);
    }
  }, [sessions, selectedSessionId]);

  const handleSessionChange = (e) => {
    const sId = e.target.value;
    setSelectedSessionId(sId);
    const s = sessions.find(item => item.id === sId);
    if (s) {
      setNewStartTime(s.start_time);
      setNewEndTime(s.end_time);
      setNewRoom(s.room || '');
      setNewDay(s.day);
    }
  };

  const handleLoginForm = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setAuthError(err.message || 'Identifiants invalides');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSessionId) return;

    const currentSession = sessions.find(s => s.id === selectedSessionId);

    // 1. Si action de report : détection préalable de conflit d'horaire
    if (actionType === 'reported') {
      const conflictResult = checkScheduleConflict({
        targetSession: currentSession,
        newWeek: Number(newWeek),
        newDay,
        newStartTime,
        newEndTime,
        allSessions: sessions,
        allReports: reports,
        modulesMap
      });

      if (conflictResult.hasConflict) {
        const isDuplicate = conflictResult.isDuplicateSlot;
        setDialogConfig({
          isOpen: true,
          type: 'conflict',
          title: isDuplicate
            ? 'Créneau identique — Doublon détecté'
            : "Conflit d'horaire détecté",
          message: isDuplicate
            ? `Ce rattrapage est planifié sur le même créneau exact (${newStartTime}–${newEndTime}, ${newDay}, Semaine ${newWeek}) qu'un cours déjà existant pour le même groupe. Un rattrapage doit obligatoirement occuper un créneau différent.`
            : "Impossible de programmer ce rattrapage : un cours est déjà programmé sur ce créneau pour ce même groupe d'étudiants.",
          details: conflictResult.conflictingSession,
          confirmText: isDuplicate ? 'Choisir un autre créneau' : 'Modifier le créneau',
          showCancel: false,
          onConfirm: closeDialog,
          onCancel: closeDialog
        });
        return;
      }
    }

    setIsSubmittingReport(true);
    try {
      const reportPayload = {
        original_session_id: selectedSessionId,
        original_week: Number(originalWeek),
        status: actionType,
        note: note.trim() || null
      };

      if (actionType === 'reported') {
        reportPayload.new_week = Number(newWeek);
        reportPayload.new_day = newDay;
        reportPayload.new_date = newDate || null;
        reportPayload.new_start_time = newStartTime;
        reportPayload.new_end_time = newEndTime;
        reportPayload.new_room = newRoom.trim() || null;
      }

      await onAddReport(reportPayload);
      setNote('');

      // Popup de succès personnalisé
      setDialogConfig({
        isOpen: true,
        type: 'success',
        title: actionType === 'reported' ? 'Séance reportée avec succès' : 'Séance marquée annulée',
        message: actionType === 'reported'
          ? `Le rattrapage a été planifié en Semaine ${newWeek} (${newDay} de ${newStartTime} à ${newEndTime}) pour ${currentSession ? (modulesMap[currentSession.module_code] || currentSession.module_code) : 'le cours'}.`
          : `La séance de la Semaine ${originalWeek} a bien été enregistrée comme annulée.`,
        confirmText: 'Super',
        showCancel: false,
        onConfirm: closeDialog,
        onCancel: closeDialog
      });
    } catch (err) {
      setDialogConfig({
        isOpen: true,
        type: 'error',
        title: 'Erreur lors de l\'enregistrement',
        message: err.message || 'Une erreur inattendue est survenue.',
        confirmText: 'Fermer',
        showCancel: false,
        onConfirm: closeDialog,
        onCancel: closeDialog
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    if (!docFile || !docTitle.trim()) {
      setDialogConfig({
        isOpen: true,
        type: 'error',
        title: 'Informations incomplètes',
        message: 'Veuillez saisir un titre descriptif et sélectionner un fichier à téléverser.',
        confirmText: 'Compris',
        showCancel: false,
        onConfirm: closeDialog,
        onCancel: closeDialog
      });
      return;
    }

    setIsUploadingDoc(true);
    try {
      await onUploadDocument({
        file: docFile,
        moduleCode: docModuleCode,
        tag: docTag,
        title: docTitle.trim()
      });

      const publishedTitle = docTitle.trim();
      setDocTitle('');
      setDocFile(null);
      const fileInput = document.getElementById('file-upload-input');
      if (fileInput) fileInput.value = '';

      setDialogConfig({
        isOpen: true,
        type: 'success',
        title: 'Document publié avec succès',
        message: `Le fichier "${publishedTitle}" est maintenant disponible au téléchargement dans l'espace Documents.`,
        confirmText: 'Parfait',
        showCancel: false,
        onConfirm: closeDialog,
        onCancel: closeDialog
      });
    } catch (err) {
      setDialogConfig({
        isOpen: true,
        type: 'error',
        title: 'Erreur de téléversement',
        message: err.message || 'Impossible d\'enregistrer le document.',
        confirmText: 'Fermer',
        showCancel: false,
        onConfirm: closeDialog,
        onCancel: closeDialog
      });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const confirmDeleteReport = (report) => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Rétablir la séance d\'origine ?',
      message: `Voulez-vous supprimer ce report et réactiver la séance normale en Semaine ${report.original_week} ?`,
      confirmText: 'Rétablir la séance',
      cancelText: 'Conserver la modification',
      showCancel: true,
      onConfirm: async () => {
        closeDialog();
        await onDeleteReport(report.id);
      },
      onCancel: closeDialog
    });
  };

  const confirmDeleteDocument = (doc) => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Supprimer ce document ?',
      message: `Êtes-vous certain de vouloir supprimer définitivement "${doc.title}" ? Le fichier sera retiré du stockage public.`,
      confirmText: 'Supprimer définitivement',
      cancelText: 'Annuler',
      showCancel: true,
      onConfirm: async () => {
        closeDialog();
        await onDeleteDocument(doc.id, doc.file_path);
      },
      onCancel: closeDialog
    });
  };

  // Si l'utilisateur n'est pas connecté
  if (!adminUser) {
    return (
      <div className="admin-view">
        <CustomDialog {...dialogConfig} />

        <div className="admin-card" style={{ maxWidth: 460, margin: '20px auto' }}>
          <h3>Espace Responsable de Classe</h3>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: 16 }}>
            Accès sécurisé réservé au responsable de classe GESI3 pour marquer les reports, annulations et ajouter des cours.
          </p>

          <form onSubmit={handleLoginForm}>
            <div className="form-group">
              <label htmlFor="admin-email">Email administrateur</label>
              <input
                id="admin-email"
                type="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">Mot de passe</label>
              <input
                id="admin-password"
                type="password"
                className="form-control"
                placeholder={isSupabaseConfigured() ? 'Votre mot de passe' : 'N\'importe quel mot de passe en mode démo'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {authError && (
              <div style={{ color: '#e0553c', fontSize: '0.75rem', marginBottom: 12 }}>
                ⚠️ {authError}
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isLoggingIn}>
              {isLoggingIn ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <div style={{ marginTop: 16, fontSize: '0.72rem', opacity: 0.65, fontFamily: 'var(--font-meta)' }}>
            {isSupabaseConfigured()
              ? 'Connecté au projet Supabase distant.'
              : 'Mode démo local actif (connexion immédiate sans configuration requise).'}
          </div>
        </div>
      </div>
    );
  }

  // Si connecté : Tableau de bord admin
  return (
    <div className="admin-view">
      {/* Dialogue personnalisé actif */}
      <CustomDialog {...dialogConfig} />

      {/* Barre d'état admin */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--card)',
          border: '2px solid var(--ink)',
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 20
        }}
      >
        <div>
          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{adminUser.email}</span>
          <div style={{ marginTop: 4 }}>
            {isSupabaseConfigured() ? (
              <span className="status-badge status-connected">● Supabase Live (Postgres & Storage)</span>
            ) : (
              <span className="status-badge status-local">● Mode Local / Démo Réactif</span>
            )}
          </div>
        </div>

        <button type="button" className="btn-secondary" onClick={onLogout}>
          Déconnexion
        </button>
      </div>

      {/* SECTION 1 : RAPPORTER OU ANNULER UNE SÉANCE */}
      <div className="admin-card">
        <h3>Marquer un Report ou une Annulation</h3>

        <form onSubmit={handleReportSubmit}>
          <div className="form-group">
            <label htmlFor="session-select">Séance concernée</label>
            <select
              id="session-select"
              className="form-control"
              value={selectedSessionId}
              onChange={handleSessionChange}
              required
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.module_code} · {s.day.toUpperCase()} ({s.start_time}-{s.end_time})
                  {s.student_group ? ` [${s.student_group}]` : ' [Tous]'} · Semaines {s.week_from} à {s.week_to}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="origin-week">Semaine de la séance à modifier</label>
              <select
                id="origin-week"
                className="form-control"
                value={originalWeek}
                onChange={e => setOriginalWeek(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(w => (
                  <option key={w} value={w}>Semaine {w}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="action-type">Type d'action</label>
              <select
                id="action-type"
                className="form-control"
                value={actionType}
                onChange={e => setActionType(e.target.value)}
              >
                <option value="reported">🗓️ Reporter la séance (Rattrapage)</option>
                <option value="cancelled">🚫 Annuler purement la séance</option>
              </select>
            </div>
          </div>

          {actionType === 'reported' && (
            <div style={{ background: 'var(--paper)', padding: 12, borderRadius: 6, border: '1.5px dashed var(--ink)', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: '0.8rem', marginBottom: 8, fontFamily: 'var(--font-meta)' }}>
                Destination du rattrapage (détection automatique de conflit) :
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label htmlFor="target-week">Semaine cible</label>
                  <select
                    id="target-week"
                    className="form-control"
                    value={newWeek}
                    onChange={e => setNewWeek(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(w => (
                      <option key={w} value={w}>Semaine {w}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="target-day">Jour cible</label>
                  <select
                    id="target-day"
                    className="form-control"
                    value={newDay}
                    onChange={e => setNewDay(e.target.value)}
                  >
                    {DAYS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label htmlFor="target-date">Date calendaire (optionnelle)</label>
                  <input
                    id="target-date"
                    type="date"
                    className="form-control"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="target-start">Heure début</label>
                  <input
                    id="target-start"
                    type="text"
                    className="form-control"
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    placeholder="14:30"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="target-end">Heure fin</label>
                  <input
                    id="target-end"
                    type="text"
                    className="form-control"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    placeholder="18:30"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="target-room">Nouvelle salle (optionnelle)</label>
                <input
                  id="target-room"
                  type="text"
                  className="form-control"
                  value={newRoom}
                  onChange={e => setNewRoom(e.target.value)}
                  placeholder="ex: Salle 0.2 ou Atelier"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="report-note">Commentaire / Justification (visible par les élèves)</label>
            <input
              id="report-note"
              type="text"
              className="form-control"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="ex: Rattrapage convenu avec Pr. Salhi"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmittingReport}>
            {isSubmittingReport ? 'Vérification & Enregistrement...' : 'Enregistrer la modification'}
          </button>
        </form>

        {/* Liste des reports et annulations actifs */}
        <div style={{ marginTop: 24 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontFamily: 'var(--font-meta)' }}>
            Modifications actives ({reports.length}) :
          </h4>

          {reports.length === 0 ? (
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Aucun report ou annulation enregistré.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.map(r => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--paper)',
                    border: '1px solid var(--ink)',
                    borderRadius: 4,
                    fontSize: '0.78rem'
                  }}
                >
                  <div>
                    <strong>Semaine {r.original_week}</strong> :{' '}
                    {r.status === 'cancelled' ? (
                      <span style={{ color: '#e0553c', fontWeight: 800 }}>🚫 Annulée</span>
                    ) : (
                      <span>
                        🗓️ Reportée en Semaine {r.new_week} ({r.new_day} {r.new_start_time}-{r.new_end_time})
                      </span>
                    )}
                    {r.note && <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>« {r.note} »</div>}
                  </div>

                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => confirmDeleteReport(r)}
                    title="Rétablir la séance normale"
                  >
                    Rétablir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── SECTION 2 : PROJETS & LIVRABLES ─── */}
      <div className="admin-card">
        <h3>Ajouter un Projet / Livrable</h3>

        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!projTitle.trim() || !projDueDate) {
            setDialogConfig({ isOpen: true, type: 'error', title: 'Champs manquants', message: 'Le titre et la date d\'échéance sont obligatoires pour créer un projet.', confirmText: 'Compris', showCancel: false, onConfirm: closeDialog, onCancel: closeDialog });
            return;
          }
          setIsSubmittingProj(true);
          try {
            await onAddProject({
              module_code: projModuleCode,
              title: projTitle.trim(),
              professor: projProfessor.trim() || null,
              due_date: projDueDate,
              due_time: projDueTime || null,
              description: projDescription.trim() || null,
              document_id: projDocId || null
            });
            setProjTitle('');
            setProjProfessor('');
            setProjDueDate('');
            setProjDescription('');
            setProjDocId('');
            setDialogConfig({ isOpen: true, type: 'success', title: 'Projet ajouté', message: `Le projet "${projTitle.trim()}" a été ajouté à l'espace Projets.`, confirmText: 'Super', showCancel: false, onConfirm: closeDialog, onCancel: closeDialog });
          } catch (err) {
            setDialogConfig({ isOpen: true, type: 'error', title: 'Erreur', message: err.message || 'Impossible d\'ajouter le projet.', confirmText: 'Fermer', showCancel: false, onConfirm: closeDialog, onCancel: closeDialog });
          } finally {
            setIsSubmittingProj(false);
          }
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="proj-module">Matière</label>
              <select id="proj-module" className="form-control" value={projModuleCode} onChange={e => setProjModuleCode(e.target.value)}>
                {modules.map(m => (
                  <option key={m.module_code} value={m.module_code}>{m.module_code} — {m.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="proj-professor">Professeur référent</label>
              <input id="proj-professor" type="text" className="form-control" value={projProfessor} onChange={e => setProjProfessor(e.target.value)} placeholder="ex: Salhi" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="proj-title">Titre du projet / livrable</label>
            <input id="proj-title" type="text" className="form-control" value={projTitle} onChange={e => setProjTitle(e.target.value)} placeholder="ex: Mini-Projet Automatique — Régulation PID" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="proj-due-date">Date d'échéance</label>
              <input id="proj-due-date" type="date" className="form-control" value={projDueDate} onChange={e => setProjDueDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="proj-due-time">Heure limite</label>
              <input id="proj-due-time" type="time" className="form-control" value={projDueTime} onChange={e => setProjDueTime(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="proj-desc">Description / Consignes (optionnel)</label>
            <input id="proj-desc" type="text" className="form-control" value={projDescription} onChange={e => setProjDescription(e.target.value)} placeholder="ex: Rapport + code à rendre sur Teams" />
          </div>

          <div className="form-group">
            <label htmlFor="proj-doc">Document associé (optionnel)</label>
            <select id="proj-doc" className="form-control" value={projDocId} onChange={e => setProjDocId(e.target.value)}>
              <option value="">— Aucun document —</option>
              {documents.map(d => (
                <option key={d.id} value={d.id}>[{d.module_code}] {d.title}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmittingProj}>
            {isSubmittingProj ? 'Enregistrement...' : 'Ajouter le projet'}
          </button>
        </form>

        {/* Liste des projets existants */}
        <div style={{ marginTop: 24 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontFamily: 'var(--font-meta)' }}>Projets actifs ({projects.length}) :</h4>
          {projects.length === 0 ? (
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Aucun projet enregistré.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--paper)', border: '1px solid var(--ink)', borderRadius: 4, fontSize: '0.78rem' }}>
                  <div>
                    <strong>[{p.module_code}]</strong> {p.title}
                    {p.professor && <span style={{ opacity: 0.7, marginLeft: 8 }}>· Pr. {p.professor}</span>}
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>📅 {p.due_date}{p.due_time ? ` à ${p.due_time}` : ''}</div>
                  </div>
                  <button type="button" className="btn-danger" onClick={() => {
                    setDialogConfig({ isOpen: true, type: 'confirm', title: 'Supprimer ce projet ?', message: `Voulez-vous supprimer définitivement "${p.title}" ?`, confirmText: 'Supprimer', cancelText: 'Annuler', showCancel: true, onConfirm: async () => { closeDialog(); await onDeleteProject(p.id); }, onCancel: closeDialog });
                  }}>Supprimer</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3 : UPLOAD DE DOCUMENT */}
      <div className="admin-card">
        <h3>Ajouter un Document de Cours / TD</h3>

        <form onSubmit={handleDocSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="doc-module">Matière</label>
              <select
                id="doc-module"
                className="form-control"
                value={docModuleCode}
                onChange={e => setDocModuleCode(e.target.value)}
              >
                {modules.map(m => (
                  <option key={m.module_code} value={m.module_code}>
                    {m.module_code} — {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="doc-tag">Type de document</label>
              <select
                id="doc-tag"
                className="form-control"
                value={docTag}
                onChange={e => setDocTag(e.target.value)}
              >
                <option value="cours">Cours</option>
                <option value="td">TD</option>
                <option value="correction_td">Correction TD</option>
                <option value="tp">TP</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="doc-title">Titre du document</label>
            <input
              id="doc-title"
              type="text"
              className="form-control"
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              placeholder="ex: Chapitre 2 — Commande des Moteurs Synchrones"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="file-upload-input">Fichier (PDF, docx, etc. max 50 Mo)</label>
            <input
              id="file-upload-input"
              type="file"
              className="form-control"
              onChange={e => setDocFile(e.target.files[0] || null)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isUploadingDoc}>
            {isUploadingDoc ? 'Téléversement en cours...' : 'Publier le document'}
          </button>
        </form>

        {/* Liste des documents existants avec suppression */}
        <div style={{ marginTop: 24 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontFamily: 'var(--font-meta)' }}>
            Documents publiés ({documents.length}) :
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {documents.map(d => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--paper)',
                  border: '1px solid var(--ink)',
                  borderRadius: 4,
                  fontSize: '0.78rem'
                }}
              >
                <div>
                  <strong>[{d.module_code}]</strong> {d.title}
                  <span style={{ opacity: 0.6, marginLeft: 8 }}>({d.tag})</span>
                </div>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => confirmDeleteDocument(d)}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SECTION 4 : AJOUTER UNE SÉANCE ─── */}
      <div className="admin-card">
        <h3>Ajouter une Nouvelle Séance</h3>
        <p style={{ fontSize: '0.78rem', opacity: 0.7, marginBottom: 14 }}>
          Crée une entrée permanente dans l'emploi du temps. La séance sera visible sur toutes les semaines définies.
        </p>

        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!sesRoom.trim() || !sesProfessor.trim()) {
            setDialogConfig({ isOpen: true, type: 'error', title: 'Champs manquants', message: 'La salle et le professeur sont obligatoires.', confirmText: 'Compris', showCancel: false, onConfirm: closeDialog, onCancel: closeDialog });
            return;
          }
          setIsSubmittingSession(true);
          try {
            await onAddSession({
              module_code: sesModuleCode,
              session_type: sesSessionType,
              day: sesDay,
              start_time: sesStartTime,
              end_time: sesEndTime,
              week_from: Number(sesWeekFrom),
              week_to: Number(sesWeekTo),
              room: sesRoom.trim(),
              professor: sesProfessor.trim(),
              student_group: sesStudentGroup.trim() || null
            });
            setSesRoom('');
            setSesProfessor('');
            setSesStudentGroup('');
            setDialogConfig({ isOpen: true, type: 'success', title: 'Séance ajoutée !', message: `La séance de ${sesModuleCode} (${sesDay} ${sesStartTime}-${sesEndTime}) a été ajoutée pour les semaines ${sesWeekFrom} à ${sesWeekTo}.`, confirmText: 'Super', showCancel: false, onConfirm: closeDialog, onCancel: closeDialog });
          } catch (err) {
            setDialogConfig({ isOpen: true, type: 'error', title: 'Erreur', message: err.message || 'Impossible d\'ajouter la séance.', confirmText: 'Fermer', showCancel: false, onConfirm: closeDialog, onCancel: closeDialog });
          } finally {
            setIsSubmittingSession(false);
          }
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="ses-module">Matière (Module)</label>
              <select id="ses-module" className="form-control" value={sesModuleCode} onChange={e => setSesModuleCode(e.target.value)}>
                {modules.map(m => (
                  <option key={m.module_code} value={m.module_code}>{m.module_code} — {m.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ses-type">Type de séance</label>
              <select id="ses-type" className="form-control" value={sesSessionType} onChange={e => setSesSessionType(e.target.value)}>
                <option value="cours">Cours</option>
                <option value="td">TD</option>
                <option value="tp">TP</option>
                <option value="examen">Examen</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="ses-day">Jour</label>
              <select id="ses-day" className="form-control" value={sesDay} onChange={e => setSesDay(e.target.value)}>
                {DAYS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ses-start">Heure début</label>
              <input id="ses-start" type="text" className="form-control" value={sesStartTime} onChange={e => setSesStartTime(e.target.value)} placeholder="08:30" required />
            </div>
            <div className="form-group">
              <label htmlFor="ses-end">Heure fin</label>
              <input id="ses-end" type="text" className="form-control" value={sesEndTime} onChange={e => setSesEndTime(e.target.value)} placeholder="10:30" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="ses-week-from">Semaine début</label>
              <select id="ses-week-from" className="form-control" value={sesWeekFrom} onChange={e => setSesWeekFrom(Number(e.target.value))}>
                {[1,2,3,4,5,6,7,8,9,10,11].map(w => <option key={w} value={w}>Semaine {w}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ses-week-to">Semaine fin</label>
              <select id="ses-week-to" className="form-control" value={sesWeekTo} onChange={e => setSesWeekTo(Number(e.target.value))}>
                {[1,2,3,4,5,6,7,8,9,10,11].map(w => <option key={w} value={w}>Semaine {w}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="ses-room">Salle</label>
              <input id="ses-room" type="text" className="form-control" value={sesRoom} onChange={e => setSesRoom(e.target.value)} placeholder="ex: Salle 1.6" required />
            </div>
            <div className="form-group">
              <label htmlFor="ses-prof">Professeur</label>
              <input id="ses-prof" type="text" className="form-control" value={sesProfessor} onChange={e => setSesProfessor(e.target.value)} placeholder="ex: Pr. SALHI" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ses-group">Groupe étudiant (optionnel — laisser vide pour tous)</label>
            <input id="ses-group" type="text" className="form-control" value={sesStudentGroup} onChange={e => setSesStudentGroup(e.target.value)} placeholder="ex: Gr1 ou Gr2" />
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmittingSession}>
            {isSubmittingSession ? 'Ajout en cours...' : '➕ Ajouter la séance'}
          </button>
        </form>

        {/* Liste des séances existantes */}
        <div style={{ marginTop: 24 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontFamily: 'var(--font-meta)' }}>
            Séances enregistrées ({sessions.length}) :
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
            {sessions.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: 'var(--paper)', border: '1px solid var(--ink)', borderRadius: 4, fontSize: '0.76rem' }}>
                <div>
                  <strong>[{s.module_code}]</strong> {s.session_type} · {s.day} {s.start_time}-{s.end_time}
                  <span style={{ opacity: 0.65, marginLeft: 8 }}>Sem. {s.week_from}→{s.week_to} · {s.room}</span>
                  {s.student_group && <span style={{ marginLeft: 6, fontWeight: 700 }}>[{s.student_group}]</span>}
                </div>
                <button type="button" className="btn-danger" onClick={() => {
                  setDialogConfig({ isOpen: true, type: 'confirm', title: 'Supprimer cette séance ?', message: `Supprimer définitivement la séance ${s.module_code} (${s.day} ${s.start_time}-${s.end_time}) ?`, confirmText: 'Supprimer', cancelText: 'Annuler', showCancel: true, onConfirm: async () => { closeDialog(); await onDeleteSession(s.id); }, onCancel: closeDialog });
                }}>Supprimer</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SECTION 5 : NOTES DE SEMAINE ─── */}
      <div className="admin-card">
        <h3>Notes & Annonces par Semaine</h3>
        <p style={{ fontSize: '0.78rem', opacity: 0.7, marginBottom: 14 }}>
          Ajoutez des notes manuelles visibles dans l'emploi du temps de la semaine concernée (et dans le PDF).
        </p>

        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!noteText.trim()) return;
          setIsSubmittingNote(true);
          try {
            await onAddNote({ week: Number(noteWeek), text: noteText.trim(), type: noteType });
            setNoteText('');
            setDialogConfig({ isOpen: true, type: 'success', title: 'Note ajoutée', message: `La note a été publiée pour la Semaine ${noteWeek}.`, confirmText: 'Super', showCancel: false, onConfirm: closeDialog, onCancel: closeDialog });
          } catch (err) {
            setDialogConfig({ isOpen: true, type: 'error', title: 'Erreur', message: err.message || 'Impossible d\'ajouter la note.', confirmText: 'Fermer', showCancel: false, onConfirm: closeDialog, onCancel: closeDialog });
          } finally {
            setIsSubmittingNote(false);
          }
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="note-week">Semaine</label>
              <select id="note-week" className="form-control" value={noteWeek} onChange={e => setNoteWeek(Number(e.target.value))}>
                {[1,2,3,4,5,6,7,8,9,10,11].map(w => <option key={w} value={w}>Semaine {w}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="note-type">Type de note</label>
              <select id="note-type" className="form-control" value={noteType} onChange={e => setNoteType(e.target.value)}>
                <option value="info">ℹ️ Information</option>
                <option value="warning">⚠️ Avertissement</option>
                <option value="success">✅ Bonne nouvelle</option>
                <option value="deadline">📌 Deadline</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="note-text">Contenu de la note</label>
            <input id="note-text" type="text" className="form-control" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="ex: Pas de TP cette semaine — Examen blanc Jeudi" required />
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmittingNote}>
            {isSubmittingNote ? 'Publication...' : '📝 Publier la note'}
          </button>
        </form>

        {/* Liste des notes */}
        <div style={{ marginTop: 24 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontFamily: 'var(--font-meta)' }}>Notes actives ({notes.length}) :</h4>
          {notes.length === 0 ? (
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Aucune note enregistrée.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {notes.map(n => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: 'var(--paper)', border: '1px solid var(--ink)', borderRadius: 4, fontSize: '0.76rem' }}>
                  <div>
                    <strong>Semaine {n.week}</strong>
                    <span style={{ marginLeft: 8, opacity: 0.7 }}>({n.type})</span>
                    <div style={{ opacity: 0.85 }}>{n.text}</div>
                  </div>
                  <button type="button" className="btn-danger" onClick={() => {
                    setDialogConfig({ isOpen: true, type: 'confirm', title: 'Supprimer cette note ?', message: `Supprimer la note : "${n.text}" ?`, confirmText: 'Supprimer', cancelText: 'Annuler', showCancel: true, onConfirm: async () => { closeDialog(); await onDeleteNote(n.id); }, onCancel: closeDialog });
                  }}>Supprimer</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
