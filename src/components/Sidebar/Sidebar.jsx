// src/components/Sidebar/Sidebar.jsx
import React from 'react';
import styles from './Sidebar.module.css';

function Sidebar({ onSelectApp, selectedApp }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <h3 className={styles.sectionHeader}>Choose App</h3>
        <ul>
          <li
            className={`${styles.navItem} ${selectedApp === 'conversational' ? styles.active : ''}`}
            onClick={() => onSelectApp('conversational')}
          >
            Conversational Agent
          </li>
          <li
            className={`${styles.navItem} ${selectedApp === 'mda-reviewer' ? styles.active : ''}`}
            onClick={() => onSelectApp('mda-reviewer')}
          >
            MDA Reviewer
          </li>
        </ul>
      </div>

      {/* Settings & History, Agent Settings (Expandable sections - implement collapse/expand logic) */}
      <div className={styles.section}>
        <h3 className={styles.sectionHeader}>Settings & History</h3>
        {/* Placeholder for content */}
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionHeader}>Agent Settings</h3>
        {/* Placeholder for content - e.g., temperature, output sliders */}
        <div className={styles.settingItem}>
          <label>Temperature</label>
          <input type="range" min="0" max="1" step="0.01" defaultValue="0.5" />
          <span>0.50</span>
        </div>
        <div className={styles.settingItem}>
          <label>Output</label>
          <input type="range" min="0" max="1000" step="1" defaultValue="100" />
          <span>100</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;