import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/AdminPanel.module.css';

function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [formData, setFormData] = useState({
    title: '',
    event_date: '',
    location: '',
    dress_code: '',
    theme_id: 1,
    language: 'SV'
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({ invitations: 0, guests: 0, rsvp: 0 });
  const [fetchError, setFetchError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [guestForm, setGuestForm] = useState({ name: '', email: '', invitation_id: '' });
  const [guestSuccess, setGuestSuccess] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loadAdminData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setFetchError('');
      const [invRes, guestRes] = await Promise.all([
        axios.get('http://localhost:8080/api/invitations', { headers: { Authorization: token } }),
        axios.get('http://localhost:8080/api/guests', { headers: { Authorization: token } })
      ]);
      setInvitations(invRes.data);
      setGuests(guestRes.data);
      const answered = guestRes.data.filter(
        (g) => g.rsvp_status === 'attending' || g.rsvp_status === 'not_attending'
      ).length;
      setStats({ invitations: invRes.data.length, guests: guestRes.data.length, rsvp: answered });
    } catch (err) {
      console.error(err);
      setFetchError('Kunde inte hämta data. Logga in igen om problemet kvarstår.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/invitations', formData, {
        headers: { Authorization: token }
      });
      setSuccessMessage('Inbjudan skapad! ✅');
      setFormData({ title: '', event_date: '', location: '', dress_code: '', theme_id: 1, language: 'SV' });
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Lägger till en ny gäst
  const handleAddGuest = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/guests', guestForm, {
        headers: { Authorization: token }
      });
      setGuestSuccess(`Gäst tillagd! Kod: ${response.data.unique_code} 🎉`);
      setGuestForm({ name: '', email: '', invitation_id: '' });
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Kopiera inbjudningslänk till urklipp
  const copyLink = (code) => {
    navigator.clipboard.writeText(`http://localhost:3000/invitation/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  useEffect(() => {
    if (['dashboard', 'guests', 'invitations', 'addguest'].includes(activeTab)) {
      loadAdminData();
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
          <button
            className={activeTab === 'guests' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('guests')}
          >
            👥 Gäster & OSA
          </button>
          <button
            className={activeTab === 'addguest' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('addguest')}
          >
            ➕ Lägg till gäst
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
                <p className={styles.statNumber}>{stats.invitations}</p>
                <p className={styles.statLabel}>Inbjudningar</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statNumber}>{stats.guests}</p>
                <p className={styles.statLabel}>Gäster</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statNumber}>{stats.rsvp}</p>
                <p className={styles.statLabel}>OSA-svar</p>
              </div>
            </div>
          </div>
        )}

        {/* Skapa inbjudan */}
        {activeTab === 'create' && (
          <div className={styles.content}>
            <h1 className={styles.title}>Skapa inbjudan</h1>
            <p className={styles.subtitle}>Fyll i informationen nedan</p>
            {successMessage && <p className={styles.success}>{successMessage}</p>}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Titel</label>
                <input className={styles.input} type="text" name="title"
                  placeholder="T.ex. Isabella & Alexander"
                  value={formData.title} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Datum & Tid</label>
                <input className={styles.input} type="datetime-local" name="event_date"
                  value={formData.event_date} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Plats</label>
                <input className={styles.input} type="text" name="location"
                  placeholder="T.ex. Grand Hôtel, Stockholm"
                  value={formData.location} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Klädkod</label>
                <input className={styles.input} type="text" name="dress_code"
                  placeholder="T.ex. Black Tie"
                  value={formData.dress_code} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tema</label>
                <select className={styles.input} name="theme_id"
                  value={formData.theme_id} onChange={handleChange}>
                  <option value="1">Bröllop</option>
                  <option value="2">Bridal Shower</option>
                  <option value="3">Födelsedag</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Språk</label>
                <select className={styles.input} name="language"
                  value={formData.language} onChange={handleChange}>
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
              <p className={styles.empty}>Inga inbjudningar än!</p>
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

        {/* Gäster & OSA */}
        {activeTab === 'guests' && (
          <div className={styles.content}>
            <h1 className={styles.title}>Gäster & OSA</h1>
            <p className={styles.subtitle}>Alla gästers svar</p>
            {fetchError && <p className={styles.error}>{fetchError}</p>}
            {!fetchError && guests.length === 0 ? (
              <p className={styles.empty}>Inga gäster än!</p>
            ) : !fetchError ? (
              <div className={styles.invitationList}>
                {guests.map((guest) => (
                  <div key={guest.id} className={styles.invitationCard}>
                    <div className={styles.invitationInfo}>
                      <h3 className={styles.invitationTitle}>{guest.name}</h3>
                      {guest.invitation_title && (
                        <p className={styles.invitationDress}>📌 {guest.invitation_title}</p>
                      )}
                      <p className={styles.invitationDate}>
                        {guest.rsvp_status === 'attending' ? '✅ Kommer' :
                         guest.rsvp_status === 'not_attending' ? '❌ Kommer ej' :
                         '⏳ Ej svarat'}
                      </p>
                      {guest.dietary_requirements && (
                        <p className={styles.invitationLocation}>🍽️ {guest.dietary_requirements}</p>
                      )}
                      {guest.message && (
                        <p className={styles.invitationDress}>💬 {guest.message}</p>
                      )}
                      <p className={styles.invitationLocation}>🔑 Kod: {guest.unique_code}</p>
                      <button
                        className={styles.copyBtn}
                        onClick={() => copyLink(guest.unique_code)}
                      >
                        {copiedCode === guest.unique_code ? '✅ Kopierad!' : '📋 Kopiera inbjudningslänk'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Lägg till gäst */}
        {activeTab === 'addguest' && (
          <div className={styles.content}>
            <h1 className={styles.title}>Lägg till gäst</h1>
            <p className={styles.subtitle}>Lägg till en gäst till en inbjudan</p>
            {guestSuccess && <p className={styles.success}>{guestSuccess}</p>}
            <form onSubmit={handleAddGuest} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Namn</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="T.ex. Anna Svensson"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({...guestForm, name: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="T.ex. anna@example.com"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm({...guestForm, email: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Välj inbjudan</label>
                <select
                  className={styles.input}
                  value={guestForm.invitation_id}
                  onChange={(e) => setGuestForm({...guestForm, invitation_id: e.target.value})}
                >
                  <option value="">-- Välj inbjudan --</option>
                  {invitations.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.title}
                    </option>
                  ))}
                </select>
              </div>
              <button className={styles.submitBtn} type="submit">
                Lägg till gäst
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminPanel;