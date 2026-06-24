import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Home.module.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.brand} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Digital Invitations
        </button>
        <button className={styles.loginButton} onClick={() => navigate('/login')}>
          Admin
        </button>
      </header>

      <main className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.badge}>Digitala inbjudningar</p>
          <h1 className={styles.title}>
            En inbjudan värd att <em>minnas.</em>
          </h1>
          <p className={styles.subtitle}>
            Video, musik, nedräkning och OSA samlat i en personlig upplevelse
            som fungerar lika fint i mobilen som på datorn.
          </p>
          <div className={styles.actions}>
            <button className={styles.button} onClick={() => navigate('/invitation/demo')}>
              Öppna demo
            </button>
            <button className={styles.textButton} onClick={() => navigate('/login')}>
              Skapa inbjudan
            </button>
          </div>
        </div>

        <div className={styles.preview} id="preview">
          <div className={styles.glow}></div>
          <div className={styles.phone}>
            <video
              className={styles.previewVideo}
              src="/videos/background.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
            <div className={styles.videoShade}></div>
            <div className={styles.previewText}>
              <span>Du är inbjuden</span>
              <strong>Isabella <i>&</i> Alexander</strong>
              <small>14 juni 2027 · Stockholm</small>
            </div>
          </div>
          <div className={`${styles.sampleCard} ${styles.cardLeft}`}>
            <span>01</span>
            Personlig design
          </div>
          <div className={`${styles.sampleCard} ${styles.cardRight}`}>
            <span>02</span>
            Video & musik
          </div>
        </div>
      </main>

      <section className={styles.features}>
        <p>Allt du behöver</p>
        <div className={styles.featureGrid}>
          <article>
            <span>01</span>
            <h2>Animerad öppning</h2>
            <p>Gästen öppnar ett personligt kuvert innan inbjudan visas.</p>
          </article>
          <article>
            <span>02</span>
            <h2>Levande bakgrund</h2>
            <p>Video och mjuka rörelser skapar en elegant första känsla.</p>
          </article>
          <article>
            <span>03</span>
            <h2>Enkel att dela</h2>
            <p>Skicka den privata länken direkt via sms eller WhatsApp.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default Home;
