import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Home.module.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <p className={styles.badge}>Välkommen</p>
        <h1 className={styles.title}>Digital</h1>
        <h1 className={styles.titleItalic}>Invitations</h1>
        <div className={styles.divider}></div>
        <p className={styles.subtitle}>
          Skapa vackra digitala inbjudningar för dina speciella tillfällen
        </p>
        <button
          className={styles.button}
          onClick={() => navigate('/login')}
        >
          ADMIN LOGIN
        </button>
      </div>
    </div>
  );
}

export default Home;