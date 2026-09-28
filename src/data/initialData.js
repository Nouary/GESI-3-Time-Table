// Données initiales GESI3 (Semestre 5, ENSA Fès 2026/2027)
// Utilisées comme jeu de données par défaut ou fallback hors-ligne

export const INITIAL_MODULES = [
  { module_code: 'M351', parent_code: 'M351', name: 'Smart Grids' },
  { module_code: 'M352-1', parent_code: 'M352', name: 'Véhicule Électrique' },
  { module_code: 'M352-2', parent_code: 'M352', name: 'Véhicule Intelligent' },
  { module_code: 'M353', parent_code: 'M353', name: "Gestion d'Énergie Multisources" },
  { module_code: 'M354-1', parent_code: 'M354', name: 'Confort Thermique' },
  { module_code: 'M354-2', parent_code: 'M354', name: 'Dimensionnement Énergétique' },
  { module_code: 'M355-1', parent_code: 'M355', name: 'Français' },
  { module_code: 'M355-2', parent_code: 'M355', name: 'Anglais' },
  { module_code: 'M356', parent_code: 'M356', name: 'Entrepreneuriat et Management de Projets' },
  { module_code: 'M357', parent_code: 'M357', name: 'Efficacité et Audit Énergétique' }
];

export const PARENT_MODULES = [
  { code: 'ALL', name: 'Toutes les matières' },
  { code: 'M351', name: 'Smart Grids' },
  { code: 'M352', name: 'Véhicule' },
  { code: 'M353', name: 'Énergie Multisources' },
  { code: 'M354', name: 'Confort / Dimensionnement' },
  { code: 'M355', name: 'Langues' },
  { code: 'M356', name: 'Management' },
  { code: 'M357', name: 'Audit Énergétique' }
];

export const INITIAL_SESSIONS = [
  // ===== LUNDI =====
  {
    id: 's-lundi-1',
    module_code: 'M352-2',
    session_type: 'cours',
    day: 'lundi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 1,
    week_to: 5,
    room: 'Salle 1.6',
    professor: 'El Aafou',
    student_group: null
  },
  {
    id: 's-lundi-2',
    module_code: 'M352-1',
    session_type: 'cours',
    day: 'lundi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 6,
    week_to: 11,
    room: 'Salle 1.6',
    professor: 'Salhi',
    student_group: null
  },
  {
    id: 's-lundi-3',
    module_code: 'M353',
    session_type: 'tp',
    day: 'lundi',
    start_time: '14:30',
    end_time: '18:30',
    week_from: 7,
    week_to: 11,
    room: 'Atelier Électrotechnique',
    professor: 'Hihi',
    student_group: 'Gr2'
  },

  // ===== MARDI =====
  {
    id: 's-mardi-1',
    module_code: 'M355-2',
    session_type: 'cours',
    day: 'mardi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 1,
    week_to: 4,
    room: 'Salle 0.7',
    professor: 'Achahbar',
    student_group: null
  },
  {
    id: 's-mardi-2',
    module_code: 'M355-1',
    session_type: 'cours',
    day: 'mardi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 8,
    week_to: 11,
    room: 'Salle 0.7',
    professor: 'Nasri',
    student_group: null
  },
  {
    id: 's-mardi-3',
    module_code: 'M357',
    session_type: 'cours_td',
    day: 'mardi',
    start_time: '14:30',
    end_time: '18:30',
    week_from: 1,
    week_to: 9,
    room: 'Salle 0.2',
    professor: 'J. El Haini',
    student_group: null
  },
  {
    id: 's-mardi-4',
    module_code: 'M357',
    session_type: 'tp',
    day: 'mardi',
    start_time: '14:30',
    end_time: '18:30',
    week_from: 10,
    week_to: 11,
    room: 'Salle 0.2',
    professor: 'J. El Haini',
    student_group: 'Gr1'
  },

  // ===== MERCREDI =====
  {
    id: 's-mercredi-1',
    module_code: 'M351',
    session_type: 'cours_td',
    day: 'mercredi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 1,
    week_to: 7,
    room: 'Salle 2.13',
    professor: 'M. Salhi',
    student_group: null
  },
  {
    id: 's-mercredi-2',
    module_code: 'M351',
    session_type: 'cours_td',
    day: 'mercredi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 8,
    week_to: 9,
    room: 'Salle 1.8',
    professor: 'M. Salhi',
    student_group: null
  },
  {
    id: 's-mercredi-3',
    module_code: 'M351',
    session_type: 'tp',
    day: 'mercredi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 10,
    week_to: 10,
    room: 'Salle 1.8',
    professor: 'M. Salhi',
    student_group: null
  },
  {
    id: 's-mercredi-4',
    module_code: 'M351',
    session_type: 'ap',
    day: 'mercredi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 11,
    week_to: 11,
    room: 'Salle 1.8',
    professor: 'M. Salhi',
    student_group: null
  },
  {
    id: 's-mercredi-5',
    module_code: 'M354-2',
    session_type: 'cours_td',
    day: 'mercredi',
    start_time: '14:30',
    end_time: '18:30',
    week_from: 6,
    week_to: 9,
    room: 'Salle 0.2',
    professor: 'El Hammami',
    student_group: null
  },
  {
    id: 's-mercredi-6',
    module_code: 'M354-2',
    session_type: 'tp',
    day: 'mercredi',
    start_time: '14:30',
    end_time: '18:30',
    week_from: 10,
    week_to: 11,
    room: 'Salle 0.2',
    professor: 'El Hammami',
    student_group: 'Gr1'
  },

  // ===== JEUDI =====
  {
    id: 's-jeudi-1',
    module_code: 'M353',
    session_type: 'cours_td',
    day: 'jeudi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 1,
    week_to: 4,
    room: 'Salle 2.11',
    professor: 'Hihi',
    student_group: null
  },
  {
    id: 's-jeudi-2',
    module_code: 'M353',
    session_type: 'cours_td',
    day: 'jeudi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 5,
    week_to: 6,
    room: 'Salle 1.6',
    professor: 'Hihi',
    student_group: null
  },
  {
    id: 's-jeudi-3',
    module_code: 'M353',
    session_type: 'tp',
    day: 'jeudi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 7,
    week_to: 11,
    room: 'Atelier Électrotechnique',
    professor: 'Hihi',
    student_group: 'Gr1'
  },
  {
    id: 's-jeudi-4',
    module_code: 'M354-2',
    session_type: 'tp',
    day: 'jeudi',
    start_time: '14:30',
    end_time: '18:30',
    week_from: 10,
    week_to: 11,
    room: 'Salle 1.7',
    professor: 'El Hammami',
    student_group: 'Gr2'
  },

  // ===== VENDREDI =====
  {
    id: 's-vendredi-1',
    module_code: 'M354-1',
    session_type: 'cours_td',
    day: 'vendredi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 6,
    week_to: 9,
    room: 'Salle 1.6',
    professor: 'Ouhaibi',
    student_group: null
  },
  {
    id: 's-vendredi-2',
    module_code: 'M354-1',
    session_type: 'tp',
    day: 'vendredi',
    start_time: '08:30',
    end_time: '12:30',
    week_from: 10,
    week_to: 11,
    room: 'Salle 1.6',
    professor: 'Ouhaibi',
    student_group: 'Gr1'
  },
  {
    id: 's-vendredi-3',
    module_code: 'M356',
    session_type: 'cours',
    day: 'vendredi',
    start_time: '14:30',
    end_time: '16:30',
    week_from: 1,
    week_to: 8,
    room: 'Salle 1.1',
    professor: 'Alla',
    student_group: null
  },
  {
    id: 's-vendredi-4',
    module_code: 'M357',
    session_type: 'tp',
    day: 'vendredi',
    start_time: '14:30',
    end_time: '16:30',
    week_from: 10,
    week_to: 11,
    room: 'Salle 1.6',
    professor: 'J. El Haini',
    student_group: 'Gr2'
  },
  {
    id: 's-vendredi-5',
    module_code: 'M354-1',
    session_type: 'tp',
    day: 'vendredi',
    start_time: '16:30',
    end_time: '18:30',
    week_from: 10,
    week_to: 11,
    room: 'Salle 2.13',
    professor: 'Ouhaibi',
    student_group: 'Gr2'
  },

  // ===== SAMEDI =====
  {
    id: 's-samedi-1',
    module_code: 'M355-2',
    session_type: 'ap',
    day: 'samedi',
    start_time: '14:30',
    end_time: '16:30',
    week_from: 4,
    week_to: 7,
    room: 'Salle Langues',
    professor: 'Elogha',
    student_group: null
  },
  {
    id: 's-samedi-2',
    module_code: 'M355-1',
    session_type: 'ap',
    day: 'samedi',
    start_time: '16:30',
    end_time: '18:30',
    week_from: 4,
    week_to: 7,
    room: 'Salle Langues',
    professor: 'Elogha',
    student_group: null
  }
];

export const INITIAL_REPORTS = [
  {
    id: 'rep-demo-1',
    original_session_id: 's-mardi-3',
    original_week: 3,
    status: 'reported',
    new_week: 4,
    new_day: 'jeudi',
    new_date: '2026-10-08',
    new_start_time: '14:30',
    new_end_time: '18:30',
    new_room: 'Salle 0.2',
    note: 'Rattrapage convenu avec Pr. J. El Haini'
  }
];

export const INITIAL_DOCUMENTS = [
  {
    id: 'doc-1',
    module_code: 'M351',
    tag: 'cours',
    title: 'Smart Grids — Chapitre 1 : Introduction aux Réseaux Intelligents',
    file_path: 'M351/intro_smart_grids.pdf',
    file_url: 'https://example.com/demo.pdf',
    file_size_bytes: 2450000,
    uploaded_at: '2026-09-26T10:15:00Z'
  },
  {
    id: 'doc-2',
    module_code: 'M351',
    tag: 'td',
    title: 'TD Smart Grids n°1 — Topologies et Flux de Puissance',
    file_path: 'M351/td1_smart_grids.pdf',
    file_url: 'https://example.com/demo.pdf',
    file_size_bytes: 654000,
    uploaded_at: '2026-09-27T14:30:00Z'
  },
  {
    id: 'doc-3',
    module_code: 'M352-2',
    tag: 'cours',
    title: 'Véhicule Intelligent — Systèmes ADAS et Capteurs LiDAR',
    file_path: 'M352-2/cours_adas.pdf',
    file_url: 'https://example.com/demo.pdf',
    file_size_bytes: 3890000,
    uploaded_at: '2026-09-28T09:00:00Z'
  },
  {
    id: 'doc-4',
    module_code: 'M357',
    tag: 'cours',
    title: 'Audit Énergétique — Méthodologie et Norme ISO 50001',
    file_path: 'M357/audit_iso50001.pdf',
    file_url: 'https://example.com/demo.pdf',
    file_size_bytes: 1820000,
    uploaded_at: '2026-09-28T09:00:00Z'
  }
];

export const INITIAL_PROJECTS = [
  {
    id: 'proj-1',
    module_code: 'M351',
    title: 'Projet Smart Grids : Dimensionnement d\'un micro-réseau solaire avec stockage',
    description: 'Modélisation sous MATLAB/Simulink du flux de puissance et optimisation du banc de batteries lithium-ion. Rapport de 15 pages + code source.',
    due_date: '2026-10-25',
    due_time: '23:59',
    professor: 'M. Salhi',
    document_id: 'doc-1'
  },
  {
    id: 'proj-2',
    module_code: 'M352-2',
    title: 'Livrable Véhicule Intelligent : Détection d\'obstacles par LiDAR et Caméra',
    description: 'Mise en œuvre d\'un algorithme de détection sous ROS2 pour scénario urbain à 50 km/h. Présentation orale de 10 min.',
    due_date: '2026-11-05',
    due_time: '18:00',
    professor: 'El Aafou',
    document_id: 'doc-3'
  },
  {
    id: 'proj-3',
    module_code: 'M357',
    title: 'Étude de cas Audit Énergétique : Diagnostic de l\'Atelier Électrotechnique',
    description: 'Relevé des puissances actives/réactives, calcul du facteur de puissance et proposition d\'un plan d\'action d\'efficacité énergétique.',
    due_date: '2026-10-18',
    due_time: '14:30',
    professor: 'J. El Haini',
    document_id: 'doc-4'
  }
];

export const INITIAL_NOTES = [
  {
    id: 'note-1',
    week: 1,
    title: 'Rentrée Universitaire Semestre 5',
    content: 'Début officiel des enseignements magistraux et distribution des groupes de TP.',
    tag: 'info',
    created_at: '2026-09-14T08:00:00Z'
  },
  {
    id: 'note-2',
    week: 3,
    title: 'Démarrage des TP Atelier',
    content: 'Les étudiants du Gr1 et Gr2 doivent se munir de leurs blouses et consignes de sécurité.',
    tag: 'alerte',
    created_at: '2026-09-28T08:00:00Z'
  }
];

