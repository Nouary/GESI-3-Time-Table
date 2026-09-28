import { supabase, isSupabaseConfigured } from './supabase';
import {
  INITIAL_MODULES,
  INITIAL_SESSIONS,
  INITIAL_REPORTS,
  INITIAL_DOCUMENTS,
  INITIAL_PROJECTS,
  INITIAL_NOTES
} from '../data/initialData';

// Clés pour le stockage local de secours
const STORAGE_KEYS = {
  MODULES: 'gesi3_modules',
  SESSIONS: 'gesi3_sessions',
  REPORTS: 'gesi3_reports',
  DOCUMENTS: 'gesi3_documents',
  PROJECTS: 'gesi3_projects',
  NOTES: 'gesi3_notes',
  AUTH: 'gesi3_mock_auth'
};

function getLocalData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erreur lecture localStorage:', err);
    return fallback;
  }
}

function setLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Erreur écriture localStorage:', err);
  }
}

// ================= MODULES =================
export async function getModules() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('module_code');
    if (error) throw error;
    return data;
  }
  return getLocalData(STORAGE_KEYS.MODULES, INITIAL_MODULES);
}

// ================= SESSIONS =================
export async function getSessions() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, modules(*)')
      .order('start_time');
    if (error) throw error;
    return data;
  }
  return getLocalData(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
}

export async function addSession(session) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('sessions')
      .insert([session])
      .select('*, modules(*)')
      .single();
    if (error) throw error;
    return data;
  }
  const current = getLocalData(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
  const newSession = {
    ...session,
    id: 'sess-' + Date.now(),
    created_at: new Date().toISOString()
  };
  const updated = [...current, newSession];
  setLocalData(STORAGE_KEYS.SESSIONS, updated);
  return newSession;
}

export async function deleteSession(sessionId) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);
    if (error) throw error;
    return true;
  }
  const current = getLocalData(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
  const updated = current.filter(s => s.id !== sessionId);
  setLocalData(STORAGE_KEYS.SESSIONS, updated);
  return true;
}

// ================= REPORTS =================
export async function getReports() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
  return getLocalData(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
}

export async function addReport(report) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('reports')
      .insert([report])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const current = getLocalData(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
  const newReport = {
    ...report,
    id: 'rep-' + Date.now(),
    created_at: new Date().toISOString()
  };
  const updated = [newReport, ...current];
  setLocalData(STORAGE_KEYS.REPORTS, updated);
  return newReport;
}

export async function deleteReport(reportId) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);
    if (error) throw error;
    return true;
  }
  const current = getLocalData(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
  const updated = current.filter(r => r.id !== reportId);
  setLocalData(STORAGE_KEYS.REPORTS, updated);
  return true;
}

// ================= DOCUMENTS =================
export async function getDocuments(moduleCode = null, tag = null) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from('documents')
      .select('*, modules(*)')
      .order('uploaded_at', { ascending: false });

    if (moduleCode && moduleCode !== 'ALL') {
      query = query.eq('module_code', moduleCode);
    }
    if (tag && tag !== 'all') {
      query = query.eq('tag', tag);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  let docs = getLocalData(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  if (moduleCode && moduleCode !== 'ALL') {
    docs = docs.filter(d => d.module_code.startsWith(moduleCode));
  }
  if (tag && tag !== 'all') {
    docs = docs.filter(d => d.tag === tag);
  }
  return docs;
}

export async function uploadDocument({ file, moduleCode, tag, title }) {
  if (isSupabaseConfigured()) {
    // 1. Upload dans Supabase Storage
    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `${moduleCode}/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    // 2. Récupérer l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // 3. Insérer en base de données
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          module_code: moduleCode,
          tag,
          title,
          file_path: filePath,
          file_url: publicUrlData.publicUrl,
          file_size_bytes: file.size
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  }

  // Mode Démo / Hors-ligne
  const mockDoc = {
    id: 'doc-' + Date.now(),
    module_code: moduleCode,
    tag,
    title,
    file_path: `${moduleCode}/${file.name}`,
    file_url: URL.createObjectURL(file),
    file_size_bytes: file.size,
    uploaded_at: new Date().toISOString()
  };

  const current = getLocalData(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  const updated = [mockDoc, ...current];
  setLocalData(STORAGE_KEYS.DOCUMENTS, updated);
  return mockDoc;
}

export async function deleteDocument(docId, filePath) {
  if (isSupabaseConfigured()) {
    // 1. Supprimer du bucket Supabase Storage
    if (filePath) {
      await supabase.storage.from('documents').remove([filePath]);
    }
    // 2. Supprimer de la table documents
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId);
    if (error) throw error;
    return true;
  }

  const current = getLocalData(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  const updated = current.filter(d => d.id !== docId);
  setLocalData(STORAGE_KEYS.DOCUMENTS, updated);
  return true;
}

// ================= PROJETS & DEADLINES =================
export async function getProjects() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('projects')
      .select('*, modules(*), documents(*)')
      .order('due_date', { ascending: true });
    if (error) {
      console.warn('Table projects pas encore créée dans Supabase, fallback initial', error.message);
      return getLocalData(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    }
    return data;
  }
  return getLocalData(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
}

export async function addProject(project) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const current = getLocalData(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const newProject = {
    ...project,
    id: 'proj-' + Date.now(),
    created_at: new Date().toISOString()
  };
  const updated = [...current, newProject];
  setLocalData(STORAGE_KEYS.PROJECTS, updated);
  return newProject;
}

export async function deleteProject(projectId) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    if (error) throw error;
    return true;
  }
  const current = getLocalData(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const updated = current.filter(p => p.id !== projectId);
  setLocalData(STORAGE_KEYS.PROJECTS, updated);
  return true;
}

// ================= NOTES DE SEMAINE =================
export async function getNotes() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Table notes pas encore créée dans Supabase, fallback', error.message);
      return getLocalData(STORAGE_KEYS.NOTES, INITIAL_NOTES);
    }
    return data;
  }
  return getLocalData(STORAGE_KEYS.NOTES, INITIAL_NOTES);
}

export async function addNote(note) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('notes')
      .insert([note])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const current = getLocalData(STORAGE_KEYS.NOTES, INITIAL_NOTES);
  const newNote = {
    ...note,
    id: 'note-' + Date.now(),
    created_at: new Date().toISOString()
  };
  const updated = [newNote, ...current];
  setLocalData(STORAGE_KEYS.NOTES, updated);
  return newNote;
}

export async function deleteNote(noteId) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);
    if (error) throw error;
    return true;
  }
  const current = getLocalData(STORAGE_KEYS.NOTES, INITIAL_NOTES);
  const updated = current.filter(n => n.id !== noteId);
  setLocalData(STORAGE_KEYS.NOTES, updated);
  return true;
}

// ================= AUTH =================
export async function signInAdmin(email, password) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data.user;
  }

  // Mode Démo : autorise n'importe quel mot de passe ou "admin@gesi3.ensa"
  const mockUser = {
    id: 'demo-admin-id',
    email: email || 'admin@gesi3.ensa',
    role: 'authenticated'
  };
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(mockUser));
  return mockUser;
}

export async function signOutAdmin() {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  return true;
}

export async function getCurrentAdmin() {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? session.user : null;
  }
  const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
  return raw ? JSON.parse(raw) : null;
}
