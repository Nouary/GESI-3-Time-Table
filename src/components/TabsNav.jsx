import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function TabsNav({ activeTab, onSelectTab, projectsCount = 0 }) {
  const { labels } = useTheme();

  return (
    <nav className="tabs-container" aria-label="Navigation principale">
      <button
        type="button"
        className={`tab-btn ${activeTab === 'planning' ? 'active' : ''}`}
        onClick={() => onSelectTab('planning')}
      >
        {labels.planning}
      </button>

      <button
        type="button"
        className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
        onClick={() => onSelectTab('projects')}
      >
        {labels.projects}
        {projectsCount > 0 && (
          <span className="tab-badge">{projectsCount}</span>
        )}
      </button>

      <button
        type="button"
        className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
        onClick={() => onSelectTab('docs')}
      >
        {labels.docs}
      </button>

      <button
        type="button"
        className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
        onClick={() => onSelectTab('admin')}
      >
        {labels.admin}
      </button>
    </nav>
  );
}
