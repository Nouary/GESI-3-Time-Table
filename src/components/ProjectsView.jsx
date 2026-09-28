import React from 'react';

function getDaysRemaining(dueDateStr) {
  if (!dueDateStr) return null;
  const target = new Date(dueDateStr + 'T23:59:59');
  const now = new Date();
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatDateFr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export default function ProjectsView({ projects = [], modules = [], documents = [] }) {
  const modulesMap = React.useMemo(() => {
    const map = {};
    modules.forEach(m => {
      map[m.module_code] = m.name;
    });
    return map;
  }, [modules]);

  const docsMap = React.useMemo(() => {
    const map = {};
    documents.forEach(d => {
      map[d.id] = d;
    });
    return map;
  }, [documents]);

  // Trier par date d'échéance croissante
  const sortedProjects = [...projects].sort((a, b) => {
    return new Date(a.due_date) - new Date(b.due_date);
  });

  return (
    <div className="projects-view">
      <div className="projects-header">
        <h2 className="projects-main-title">Projets & Livrables à Rendre</h2>
        <p className="projects-sub">
          Suivi des échéances académiques, sujets de TP/projets, enseignants référents et consignes de rendu.
        </p>
      </div>

      {sortedProjects.length === 0 ? (
        <div className="empty-day" style={{ textAlign: 'center', padding: '40px 10px' }}>
          Aucun projet ou livrable n'est programmé pour le moment.
        </div>
      ) : (
        <div className="projects-grid">
          {sortedProjects.map((p, index) => {
            const daysRemaining = getDaysRemaining(p.due_date);
            const isUrgent = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;
            const isOverdue = daysRemaining !== null && daysRemaining < 0;
            const attachedDoc = p.document_id ? docsMap[p.document_id] : null;

            return (
              <article
                key={p.id}
                className={`project-card ${isUrgent ? 'is-urgent' : ''} ${isOverdue ? 'is-overdue' : ''} ${
                  index % 2 === 0 ? 'tilt-left' : 'tilt-right'
                }`}
              >
                <div className="project-top">
                  <div className="project-module-tag">
                    <span className="p-code">{p.module_code}</span>
                    <span className="p-mname">{modulesMap[p.module_code] || ''}</span>
                  </div>

                  {/* Badge Échéance */}
                  {isOverdue ? (
                    <span className="due-badge badge-overdue">Date dépassée</span>
                  ) : isUrgent ? (
                    <span className="due-badge badge-urgent">⚠️ J-{daysRemaining} ({daysRemaining === 0 ? "Aujourd'hui" : `${daysRemaining}j restants`})</span>
                  ) : (
                    <span className="due-badge badge-normal">J-{daysRemaining} ({daysRemaining}j)</span>
                  )}
                </div>

                <h3 className="project-title">{p.title}</h3>

                <div className="project-meta-line">
                  <span>📅 Pour le <strong>{formatDateFr(p.due_date)}</strong> {p.due_time ? `à ${p.due_time}` : ''}</span>
                  {p.professor && <span>· Pr. <strong>{p.professor}</strong></span>}
                </div>

                {p.description && (
                  <p className="project-description">{p.description}</p>
                )}

                {/* Document associé (Sujet, barème, etc.) */}
                {attachedDoc && (
                  <div className="project-doc-link">
                    <span className="doc-icon">📎</span>
                    <div className="doc-info">
                      <div className="doc-name">{attachedDoc.title}</div>
                      <div className="doc-sub">Document officiel de cadrage / consignes</div>
                    </div>
                    <a
                      href={attachedDoc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doc-download-btn"
                    >
                      Consulter ↓
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
