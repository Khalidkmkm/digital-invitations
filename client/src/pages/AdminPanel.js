import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/AdminPanel.module.css';

function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // State för formuläret
  const [formData, setFormData] = useState({
    title: '',
    event_date: '',
    location: '',
    dress_code: '',
    theme_id: 1,
    language: 'SV'
  });
  const [successMessage, setSuccessMessage] = useState('');

  // State för inbjudningar
  const [invitations, setInvitations] = useState([]);

  // Logga ut admin
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Hanterar ändringar i formuläret
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Skickar formuläret till backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/invitations', formData, {
        headers: { Authorization: token }
      });
      setSuccessMessage('Inbjudan skapad! ✅');
      setFormData({ title: '', event_date: '', location: '', dress_code: '', theme_id: 1, language: 'SV' });
    } catch (err) {
      console.error(err);
    }
  };

  // Hämtar inbjudningar från backend
  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/invitations', {
        headers: { Authorization: token }
      });
      setInvitations(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Hämtar inbjudningar när man klickar på Mina inbjudningar
  useEffect(() => {
    if (activeTab === 'invitations') {
      fetchInvitations();
    }
  }, [activeTab]);

  return (
    <div className={styles.container}>

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <p className={styles.logoBadge}>Admin</p>
          <h2 className={styles.logoTitle}>Digital<br/>Invitations</h2>
        </div>

        <nav className={styles.nav}>
          <button
            className={activeTab === 'dashboard' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={activeTab === 'create' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('create')}
          >
            ✉️ Skapa inbjudan
          </button>
          <button
            className={activeTab === 'invitations' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('invitations')}
          >
            📋 Mina inbjudningar
          </button>
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logga ut
        </button>
      </div>

      {/* Huvudinnehåll */}
      <div className={styles.main}>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className={styles.content}>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Översikt över dina inbjudningar</p>
            <div className={styles.stats}>
              <div className={styles.statCard}>
                <p className={styles.statNumber}>0</p>
                <p className={styles.statLabel}>Inbjudningar</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statNumber}>0</p>
                <p className={styles.statLabel}>Gäster</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statNumber}>0</p>
                <p className={styles.statLabel}>RSVP svar</p>
              </div>
            </div>
          </div>
        )}

        {/* Skapa inbjudan */}
        {activeTab === 'create' && (
          <div className={styles.content}>
            <h1 className={styles.title}>Skapa inbjudan</h1>
            <p className={styles.subtitle}>Fyll i informationen nedan</p>

            {successMessage && (
              <p className={styles.success}>{successMessage}</p>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Titel</label>
                <input
                  className={styles.input}
                  type="text"
                  name="title"
                  placeholder="T.ex. Isabella & Alexander"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Datum & Tid</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Plats</label>
                <input
                  className={styles.input}
                  type="text"
                  name="location"
                  placeholder="T.ex. Grand Hôtel, Stockholm"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Klädkod</label>
                <input
                  className={styles.input}
                  type="text"
                  name="dress_code"
                  placeholder="T.ex. Black Tie"
                  value={formData.dress_code}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Tema</label>
                <select
                  className={styles.input}
                  name="theme_id"
                  value={formData.theme_id}
                  onChange={handleChange}
                >
                  <option value="1">Bröllop</option>
                  <option value="2">Bridal Shower</option>
                  <option value="3">Födelsedag</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Språk</label>
                <select
                  className={styles.input}
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                >
                  <option value="SV">Svenska</option>
                  <option value="EN">Engelska</option>
                </select>
              </div>

              <button className={styles.submitBtn} type="submit">
                Skapa inbjudan
              </button>
            </form>
          </div>
        )}

        {/* Mina inbjudningar */}
        {activeTab === 'invitations' && (
          <div className={styles.content}>
            <h1 className={styles.title}>Mina inbjudningar</h1>
            <p className={styles.subtitle}>Alla dina skapade inbjudningar</p>

            {invitations.length === 0 ? (
              <p className={styles.empty}>Inga inbjudningar än – skapa din första!</p>
            ) : (
              <div className={styles.invitationList}>
                {invitations.map((inv) => (
                  <div key={inv.id} className={styles.invitationCard}>
                    <div className={styles.invitationInfo}>
                      <h3 className={styles.invitationTitle}>{inv.title}</h3>
                      <p className={styles.invitationDate}>📅 {new Date(inv.event_date).toLocaleDateString('sv-SE')}</p>
                      <p className={styles.invitationLocation}>📍 {inv.location}</p>
                      <p className={styles.invitationDress}>👔 {inv.dress_code}</p>
                    </div>
                    <div className={styles.invitationActions}>
                      <span className={styles.invitationId}>ID: #{inv.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminPanel;