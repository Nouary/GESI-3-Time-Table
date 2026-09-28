import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import ControlsDock from './components/ControlsDock';
import Header from './components/Header';
import TabsNav from './components/TabsNav';
import PlanningView from './components/PlanningView';
import DocumentsView from './components/DocumentsView';
import ProjectsView from './components/ProjectsView';
import AdminView from './components/AdminView';
import Footer from './components/Footer';
import IntroAnimation, { introSeen } from './components/IntroAnimation';
import {
  getModules,
  getSessions,
  getReports,
  getDocuments,
  getProjects,
  getNotes,
  addSession,
  deleteSession,
  addReport,
  deleteReport,
  uploadDocument,
  deleteDocument,
  addProject,
  deleteProject,
  addNote,
  deleteNote,
  signInAdmin,
  signOutAdmin,
  getCurrentAdmin
} from './lib/dataService';

// Calcul optionnel de la semaine courante (départ mi-septembre 2026)
function calculateCurrentWeek() {
  const SEMESTER_START = new Date('2026-09-14T00:00:00');
  const now = new Date();
  const diffDays = Math.floor((now - SEMESTER_START) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  const current = Math.floor(diffDays / 7) + 1;
  return Math.min(11, Math.max(1, current));
}

function MainApp() {
  const [showIntro, setShowIntro] = useState(() => !introSeen());
  const [activeTab, setActiveTab] = useState('planning');
  const [week, setWeek] = useState(() => calculateCurrentWeek());

  const [modules, setModules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [reports, setReports] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Chargement des données au démarrage
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [mods, sess, reps, docs, projs, nts, user] = await Promise.all([
          getModules(),
          getSessions(),
          getReports(),
          getDocuments(),
          getProjects(),
          getNotes(),
          getCurrentAdmin()
        ]);
        setModules(mods);
        setSessions(sess);
        setReports(reps);
        setDocuments(docs);
        setProjects(projs);
        setNotes(nts);
        setAdminUser(user);
      } catch (err) {
        console.error('Erreur chargement données:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePrevWeek = () => {
    setWeek(w => Math.max(1, w - 1));
  };

  const handleNextWeek = () => {
    setWeek(w => Math.min(11, w + 1));
  };

  const handleLogin = async (email, password) => {
    const user = await signInAdmin(email, password);
    setAdminUser(user);
  };

  const handleLogout = async () => {
    await signOutAdmin();
    setAdminUser(null);
  };

  const handleAddSession = async (sessionData) => {
    const newSess = await addSession(sessionData);
    setSessions(prev => [...prev, newSess]);

    // Génération et enregistrement automatique de la note pour chaque semaine concernée
    try {
      const mod = modules.find(m => m.module_code === sessionData.module_code);
      const modName = mod ? mod.name : sessionData.module_code;
      const typeLabel = sessionData.session_type ? sessionData.session_type.toUpperCase() : 'COURS';
      const grp = sessionData.student_group ? ` [${sessionData.student_group}]` : '';
      const dayLabel = sessionData.day ? (sessionData.day.charAt(0).toUpperCase() + sessionData.day.slice(1)) : '';
      const noteText = `Nouvelle séance ajoutée : ${modName} (${typeLabel}${grp}) — ${dayLabel} ${sessionData.start_time}-${sessionData.end_time} en ${sessionData.room || 'Salle'} (Pr. ${sessionData.professor || 'N/A'}).`;

      const startW = Number(sessionData.week_from) || 1;
      const endW = Number(sessionData.week_to) || startW;
      const createdNotes = [];

      for (let w = startW; w <= endW; w++) {
        const n = await addNote({
          week: w,
          text: noteText,
          type: 'added'
        });
        createdNotes.push(n);
      }

      if (createdNotes.length > 0) {
        setNotes(prev => [...createdNotes, ...prev]);
      }
    } catch (err) {
      console.warn("Impossible d'ajouter automatiquement la note de séance:", err);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    await deleteSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleAddReport = async (reportPayload) => {
    const newRep = await addReport(reportPayload);
    setReports(prev => [newRep, ...prev]);
  };

  const handleDeleteReport = async (reportId) => {
    await deleteReport(reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const handleUploadDocument = async (docData) => {
    const newDoc = await uploadDocument(docData);
    setDocuments(prev => [newDoc, ...prev]);
  };

  const handleDeleteDocument = async (docId, filePath) => {
    await deleteDocument(docId, filePath);
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const handleAddProject = async (projectData) => {
    const newProj = await addProject(projectData);
    setProjects(prev => [...prev, newProj]);
  };

  const handleDeleteProject = async (projectId) => {
    await deleteProject(projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleAddNote = async (noteData) => {
    const newNote = await addNote(noteData);
    setNotes(prev => [newNote, ...prev]);
  };

  const handleDeleteNote = async (noteId) => {
    await deleteNote(noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  return (
    <>
      {showIntro && (
        <IntroAnimation
          onDone={() => {
            setShowIntro(false);
            setWeek(calculateCurrentWeek());
            setActiveTab('planning');
          }}
        />
      )}

      <ControlsDock />
      <Header week={week} onReplayIntro={() => setShowIntro(true)} />

      <TabsNav activeTab={activeTab} onSelectTab={setActiveTab} projectsCount={projects.length} />

      <main className="page-container">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font-meta)', opacity: 0.6 }}>
            Chargement des données de la promotion...
          </div>
        ) : (
          <>
            {activeTab === 'planning' && (
              <PlanningView
                week={week}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                sessions={sessions}
                reports={reports}
                modules={modules}
                projects={projects}
                notes={notes}
              />
            )}

            {activeTab === 'docs' && (
              <DocumentsView
                documents={documents}
                modules={modules}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectsView
                projects={projects}
                modules={modules}
                documents={documents}
              />
            )}

            {activeTab === 'admin' && (
              <AdminView
                adminUser={adminUser}
                onLogin={handleLogin}
                onLogout={handleLogout}
                sessions={sessions}
                reports={reports}
                documents={documents}
                projects={projects}
                notes={notes}
                modules={modules}
                onAddSession={handleAddSession}
                onDeleteSession={handleDeleteSession}
                onAddReport={handleAddReport}
                onDeleteReport={handleDeleteReport}
                onUploadDocument={handleUploadDocument}
                onDeleteDocument={handleDeleteDocument}
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
              />
            )}
          </>
        )}
      </main>

      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
