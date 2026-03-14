import React from 'react';
import styles from '../styles/AdminPanel.module.css';

function AdminPanel() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Panel</h1>
      <p className={styles.subtitle}>Välkommen till adminpanelen!</p>
    </div>
  );
}

export default AdminPanel;