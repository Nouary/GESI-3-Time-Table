import React, { useState } from 'react';
import { PARENT_MODULES } from '../data/initialData';

const TAG_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'cours', label: 'Cours' },
  { id: 'td', label: 'TD' },
  { id: 'correction_td', label: 'Correction TD' },
  { id: 'tp', label: 'TP' },
  { id: 'autre', label: 'Autre' }
];

const TAG_COLORS = {
  cours: 'var(--accent2)',
  td: 'var(--accent2)',
  correction_td: 'var(--accent)',
  tp: '#2f6fed',
  autre: '#7a8089'
};

const TAG_LABELS = {
  cours: 'Cours',
  td: 'TD',
  correction_td: 'Correction TD',
  tp: 'TP',
  autre: 'Autre'
};

function formatFileSize(bytes) {
  if (!bytes) return 'Fichier';
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export default function DocumentsView({ documents }) {
  const [selectedParent, setSelectedParent] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState('all');

  const filteredDocuments = documents.filter(doc => {
    // Filtrage par module parent
    if (selectedParent !== 'ALL') {
      if (!doc.module_code.startsWith(selectedParent)) {
        return false;
      }
    }
    // Filtrage par tag
    if (selectedTag !== 'all') {
      if (doc.tag !== selectedTag) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="documents-view">
      {/* Chips des matières regroupées par module parent */}
      <div className="matiere-chips" role="group" aria-label="Filtrer par matière">
        {PARENT_MODULES.map(m => (
          <button
            key={m.code}
            type="button"
            className={`mchip ${selectedParent === m.code ? 'active' : ''}`}
            onClick={() => setSelectedParent(m.code)}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Filtres par type de document */}
      <div className="filters-strip" role="group" aria-label="Filtrer par type de document">
        {TAG_FILTERS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`fchip ${selectedTag === t.id ? 'active' : ''}`}
            onClick={() => setSelectedTag(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Liste des documents */}
      <div className="docs-list">
        {filteredDocuments.length === 0 ? (
          <div className="empty-day" style={{ textAlign: 'center', padding: '30px 10px' }}>
            Aucun document ne correspond à cette sélection.
          </div>
        ) : (
          filteredDocuments.map((doc, index) => {
            const isTiltEven = index % 2 === 0;
            const tagColor = TAG_COLORS[doc.tag] || 'var(--accent2)';

            return (
              <article
                key={doc.id}
                className={`doc-card ${isTiltEven ? 'tilt-even' : 'tilt-odd'}`}
              >
                <div className="doc-header">
                  <span className="dtitle">{doc.title}</span>
                  <span className="tag-badge" style={{ background: tagColor }}>
                    {TAG_LABELS[doc.tag] || doc.tag}
                  </span>
                </div>

                <div className="dmeta">
                  <span>{doc.module_code}</span>
                  <span>·</span>
                  <span>{formatFileSize(doc.file_size_bytes)}</span>
                  {doc.uploaded_at && (
                    <>
                      <span>·</span>
                      <span>Ajouté le {formatDate(doc.uploaded_at)}</span>
                    </>
                  )}
                </div>

                <div className="doc-footer">
                  <span style={{ fontSize: '0.7rem', opacity: 0.6, fontFamily: 'var(--font-meta)' }}>
                    Accès public libre
                  </span>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-download-btn"
                  >
                    <span>Télécharger</span>
                    <span>↓</span>
                  </a>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
