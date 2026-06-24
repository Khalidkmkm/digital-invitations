import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/AdminPanel.module.css';
import { apiUrl } from '../config/api';

const emptyInvitation = {
  title: '',
  event_date: '',
  location: '',
  dress_code: '',
  theme_id: 1,
  language: 'SV',
  video_background: '/videos/background.mp4',
  music_file: '/music/background.mp3',
  programme: [
    { time: '15:00', activity: 'Vigsel' }
  ]
};

const musicLibrary = [
  {
    value: '/music/background.mp3',
    name: 'Romantisk piano',
    description: 'Lugn och elegant bakgrundsmusik'
  },
  {
    value: '',
    name: 'Ingen musik',
    description: 'Inbjudan visas utan bakgrundsmusik'
  }
];

const formatDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const parseGuestCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return {
      name: row.name || row.namn || '',
      email: row.email || row.mail || '',
      phone: row.phone || row.telefon || row.number || ''
    };
  }).filter((guest) => guest.name && (guest.email || guest.phone));
};

const csvEscape = (value) => `"${String(value || '').replace(/"/g, '""')}"`;
const safeFilename = (value) => String(value || 'inbjudan').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();

const downloadCsv = (filename, rows) => {
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const normalizeWhatsAppPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `46${digits.slice(1)}`;
  return digits;
};

const buildWhatsAppLink = (guest) => {
  const phone = normalizeWhatsAppPhone(guest.phone);
  if (!phone) return '';

  const invitationLink = `${window.location.origin}/invitation/${guest.unique_code}`;
  const message = `Hej ${guest.name}! Här är din personliga inbjudan: ${invitationLink}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [formData, setFormData] = useState(emptyInvitation);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({ invitations: 0, guests: 0, rsvp: 0 });
  const [fetchError, setFetchError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [guestForm, setGuestForm] = useState({ name: '', email: '', phone: '', invitation_id: '' });
  const [guestSuccess, setGuestSuccess] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [editingInvitationId, setEditingInvitationId] = useState(null);
  const [csvGuests, setCsvGuests] = useState([]);
  const [csvMessage, setCsvMessage] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingInvitationId, setSendingInvitationId] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProgrammeChange = (index, field, value) => {
    const programme = formData.programme.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    ));
    setFormData({ ...formData, programme });
  };

  const addProgrammeItem = () => {
    setFormData({
      ...formData,
      programme: [...formData.programme, { time: '', activity: '' }]
    });
  };

  const removeProgrammeItem = (index) => {
    setFormData({
      ...formData,
      programme: formData.programme.filter((_, itemIndex) => itemIndex !== index)
    });
  };

  const loadAdminData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setFetchError('');
      const [invRes, guestRes] = await Promise.all([
        axios.get(apiUrl('/api/invitations'), { headers: { Authorization: token } }),
        axios.get(apiUrl('/api/guests'), { headers: { Authorization: token } })
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
      setCreateError('');
      const token = localStorage.getItem('token');
      if (editingInvitationId) {
        await axios.put(apiUrl(`/api/invitations/${editingInvitationId}`), formData, {
          headers: { Authorization: token }
        });
        setSuccessMessage('Inbjudan uppdaterad! ✅');
      } else {
        await axios.post(apiUrl('/api/invitations'), formData, {
          headers: { Authorization: token }
        });
        setSuccessMessage('Inbjudan skapad! ✅');
      }
      setEditingInvitationId(null);
      setFormData(emptyInvitation);
      loadAdminData();
    } catch (err) {
      console.error(err);
      setCreateError(err.response?.data?.message || 'Inbjudan kunde inte sparas.');
    }
  };

  // Lägger till en ny gäst
  const handleAddGuest = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(apiUrl('/api/guests'), guestForm, {
        headers: { Authorization: token }
      });
      setGuestSuccess(`Gäst tillagd! Kod: ${response.data.unique_code} 🎉`);
      setGuestForm({ name: '', email: '', phone: '', invitation_id: '' });
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCsvFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parsedGuests = parseGuestCsv(text);
    setCsvGuests(parsedGuests);
    setCsvMessage(`${parsedGuests.length} gäster hittades i CSV-filen.`);
  };

  const handleImportGuests = async () => {
    if (!guestForm.invitation_id) {
      setCsvMessage('Välj en inbjudan innan du importerar.');
      return;
    }

    if (csvGuests.length === 0) {
      setCsvMessage('Välj en CSV-fil med gäster först.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(apiUrl('/api/guests/import'), {
        invitation_id: guestForm.invitation_id,
        guests: csvGuests
      }, {
        headers: { Authorization: token }
      });
      setCsvMessage(response.data.message);
      setCsvGuests([]);
      loadAdminData();
    } catch (err) {
      console.error(err);
      setCsvMessage(err.response?.data?.message || 'Importen misslyckades.');
    }
  };

  const handleDeleteInvitation = async (invitation) => {
    const confirmed = window.confirm(`Vill du ta bort "${invitation.title}"? Gäster och dagsprogram tas också bort.`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(apiUrl(`/api/invitations/${invitation.id}`), {
        headers: { Authorization: token }
      });
      setDeleteMessage('Inbjudan borttagen! ✅');
      loadAdminData();
    } catch (err) {
      console.error(err);
      setDeleteMessage(err.response?.data?.message || 'Kunde inte ta bort inbjudan.');
    }
  };

  const handleEditInvitation = (invitation) => {
    setEditingInvitationId(invitation.id);
    setSuccessMessage('');
    setCreateError('');
    setFormData({
      title: invitation.title || '',
      event_date: formatDateTimeLocal(invitation.event_date),
      location: invitation.location || '',
      dress_code: invitation.dress_code || '',
      theme_id: invitation.theme_id || 1,
      language: invitation.language || 'SV',
      video_background: invitation.video_background || '',
      music_file: invitation.music_file || '',
      programme: invitation.programme && invitation.programme.length > 0
        ? invitation.programme.map((item) => ({
            time: item.time || '',
            activity: item.activity || ''
          }))
        : [{ time: '', activity: '' }]
    });
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewInvitation = (invitation) => {
    const guest = guests.find((item) => item.invitation_id === invitation.id);
    if (!guest) {
      setDeleteMessage('Lägg till en gäst först för att kunna visa inbjudan.');
      return;
    }

    window.open(`/invitation/${guest.unique_code}`, '_blank');
  };

  const cancelEdit = () => {
    setEditingInvitationId(null);
    setCreateError('');
    setSuccessMessage('');
    setFormData(emptyInvitation);
  };

  // Kopiera inbjudningslänk till urklipp
  const copyLink = (code) => {
    navigator.clipboard.writeText(`http://localhost:3000/invitation/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const exportGuests = () => {
    const rows = [
      ['name', 'email', 'phone', 'invitation', 'code', 'link', 'rsvp_status'],
      ...guests.map((guest) => [
        guest.name,
        guest.email,
        guest.phone,
        guest.invitation_title,
        guest.unique_code,
        `${window.location.origin}/invitation/${guest.unique_code}`,
        guest.rsvp_status
      ])
    ];

    downloadCsv('guest-links.csv', rows);
  };

  const getInvitationGuests = (invitationId) => {
    return guests.filter((guest) => guest.invitation_id === invitationId);
  };

  const exportWhatsAppLinks = (invitation) => {
    const invitationGuests = getInvitationGuests(invitation.id);
    const guestsWithPhone = invitationGuests.filter((guest) => normalizeWhatsAppPhone(guest.phone));

    if (guestsWithPhone.length === 0) {
      setDeleteMessage('Den här inbjudan har inga gäster med telefonnummer.');
      return;
    }

    const rows = [
      ['name', 'phone', 'code', 'invitation_link', 'whatsapp_link'],
      ...guestsWithPhone.map((guest) => [
        guest.name,
        guest.phone,
        guest.unique_code,
        `${window.location.origin}/invitation/${guest.unique_code}`,
        buildWhatsAppLink(guest)
      ])
    ];

    downloadCsv(`whatsapp-${safeFilename(invitation.title || invitation.id)}.csv`, rows);
    setDeleteMessage(`${guestsWithPhone.length} WhatsApp-länkar exporterades.`);
  };

  const sendEmailsForInvitation = async (invitation) => {
    const invitationGuests = getInvitationGuests(invitation.id);
    const emailGuests = invitationGuests.filter((guest) => guest.email);

    if (emailGuests.length === 0) {
      setEmailMessage('Den här inbjudan har inga gäster med e-postadress.');
      return;
    }

    const confirmed = window.confirm(
      `Vill du skicka e-post till ${emailGuests.length} gäster för "${invitation.title}"?`
    );
    if (!confirmed) return;

    try {
      setEmailMessage('');
      setSendingInvitationId(invitation.id);
      const token = localStorage.getItem('token');
      const response = await axios.post(apiUrl(`/api/guests/send-emails/${invitation.id}`), {}, {
        headers: { Authorization: token }
      });
      setEmailMessage(response.data.message);
    } catch (err) {
      console.error(err);
      setEmailMessage(err.response?.data?.message || 'E-post kunde inte skickas.');
    } finally {
      setSendingInvitationId(null);
    }
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
              <button
                className={styles.statCard}
                onClick={() => setActiveTab('invitations')}
              >
                <p className={styles.statNumber}>{stats.invitations}</p>
                <p className={styles.statLabel}>Inbjudningar</p>
              </button>
              <button
                className={styles.statCard}
                onClick={() => setActiveTab('guests')}
              >
                <p className={styles.statNumber}>{stats.guests}</p>
                <p className={styles.statLabel}>Gäster</p>
              </button>
              <button
                className={styles.statCard}
                onClick={() => setActiveTab('guests')}
              >
                <p className={styles.statNumber}>{stats.rsvp}</p>
                <p className={styles.statLabel}>OSA-svar</p>
              </button>
            </div>
          </div>
        )}

        {/* Skapa inbjudan */}
        {activeTab === 'create' && (
          <div className={styles.content}>
            <h1 className={styles.title}>
              {editingInvitationId ? 'Redigera inbjudan' : 'Skapa inbjudan'}
            </h1>
            <p className={styles.subtitle}>
              {editingInvitationId
                ? 'Justera informationen och spara ändringarna'
                : 'Fyll i informationen och förhandsgranska innan du sparar'}
            </p>
            {successMessage && <p className={styles.success}>{successMessage}</p>}
            {createError && <p className={styles.error}>{createError}</p>}
            <form onSubmit={handleSubmit} className={styles.createLayout}>
              <div className={styles.form}>
              <p className={styles.formSectionTitle}>Grundinformation</p>
              <div className={styles.formGroup}>
                <label className={styles.label}>Titel</label>
                <input className={styles.input} type="text" name="title"
                  placeholder="T.ex. Isabella & Alexander"
                  value={formData.title} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Datum & Tid</label>
                <input className={styles.input} type="datetime-local" name="event_date"
                  value={formData.event_date} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Plats</label>
                <input className={styles.input} type="text" name="location"
                  placeholder="T.ex. Grand Hôtel, Stockholm"
                  value={formData.location} onChange={handleChange} required />
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
                  <option value="SO">Somaliska</option>
                </select>
              </div>

              <p className={styles.formSectionTitle}>Video & musik</p>
              <div className={styles.formGroup}>
                <label className={styles.label}>Bakgrundsvideo</label>
                <select className={styles.input} name="video_background"
                  value={formData.video_background} onChange={handleChange}>
                  <option value="/videos/background.mp4">Ringar – elegant video</option>
                  <option value="">Ingen video</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Bakgrundsmusik</label>
                <select className={styles.input} name="music_file"
                  value={formData.music_file} onChange={handleChange}>
                  {musicLibrary.map((track) => (
                    <option key={track.value || 'none'} value={track.value}>
                      {track.name}
                    </option>
                  ))}
                </select>
                <div className={styles.musicChoice}>
                  <div>
                    <strong>
                      {musicLibrary.find((track) => track.value === formData.music_file)?.name}
                    </strong>
                    <span>
                      {musicLibrary.find((track) => track.value === formData.music_file)?.description}
                    </span>
                  </div>
                </div>
                {formData.music_file && (
                  <audio
                    className={styles.audioPreview}
                    key={formData.music_file}
                    src={formData.music_file}
                    controls
                    preload="metadata"
                  />
                )}
              </div>

              <div className={styles.programmeHeader}>
                <p className={styles.formSectionTitle}>Dagsprogram</p>
                <button className={styles.addRowBtn} type="button" onClick={addProgrammeItem}>
                  + Lägg till
                </button>
              </div>
              <div className={styles.programmeEditor}>
                {formData.programme.map((item, index) => (
                  <div className={styles.programmeRow} key={index}>
                    <input
                      className={`${styles.input} ${styles.timeInput}`}
                      type="time"
                      aria-label={`Tid för programpunkt ${index + 1}`}
                      value={item.time}
                      onChange={(e) => handleProgrammeChange(index, 'time', e.target.value)}
                    />
                    <input
                      className={styles.input}
                      type="text"
                      aria-label={`Aktivitet för programpunkt ${index + 1}`}
                      placeholder="T.ex. Middag"
                      value={item.activity}
                      onChange={(e) => handleProgrammeChange(index, 'activity', e.target.value)}
                    />
                    <button
                      className={styles.removeRowBtn}
                      type="button"
                      aria-label={`Ta bort programpunkt ${index + 1}`}
                      onClick={() => removeProgrammeItem(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.formActions}>
                <button className={styles.previewBtn} type="button" onClick={() => setPreviewOpen(true)}>
                  Förhandsgranska
                </button>
                <button className={styles.submitBtn} type="submit">
                  {editingInvitationId ? 'Spara ändringar' : 'Skapa inbjudan'}
                </button>
                {editingInvitationId && (
                  <button className={styles.cancelBtn} type="button" onClick={cancelEdit}>
                    Avbryt
                  </button>
                )}
              </div>
              </div>

              <div className={styles.livePreview}>
                <p className={styles.previewLabel}>Live-förhandsvisning</p>
                <div className={styles.previewPhone}>
                  {formData.video_background ? (
                    <video
                      className={styles.previewVideo}
                      src={formData.video_background}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <div className={styles.previewFallback}></div>
                  )}
                  <div className={styles.previewShade}></div>
                  <div className={styles.previewContent}>
                    <small>Du är inbjuden</small>
                    <strong>{formData.title || 'Era namn'}</strong>
                    <span>
                      {formData.event_date
                        ? new Date(formData.event_date).toLocaleDateString('sv-SE')
                        : 'Välj ett datum'}
                    </span>
                    <span>{formData.location || 'Er plats'}</span>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Mina inbjudningar */}
        {activeTab === 'invitations' && (
          <div className={styles.content}>
            <h1 className={styles.title}>Mina inbjudningar</h1>
            <p className={styles.subtitle}>Alla dina skapade inbjudningar</p>
            {deleteMessage && <p className={styles.success}>{deleteMessage}</p>}
            {emailMessage && <p className={styles.success}>{emailMessage}</p>}
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
                      <p className={styles.invitationLocation}>
                        Gäster: {getInvitationGuests(inv.id).length}
                      </p>
                    </div>
                    <div className={styles.invitationActions}>
                      <span className={styles.invitationId}>ID: #{inv.id}</span>
                      <button
                        className={styles.viewBtn}
                        onClick={() => handleViewInvitation(inv)}
                      >
                        Visa
                      </button>
                      <button
                        className={styles.editBtn}
                        onClick={() => exportWhatsAppLinks(inv)}
                      >
                        Exportera WhatsApp
                      </button>
                      <button
                        className={styles.editBtn}
                        disabled={sendingInvitationId === inv.id}
                        onClick={() => sendEmailsForInvitation(inv)}
                      >
                        {sendingInvitationId === inv.id ? 'Skickar...' : 'Skicka e-post'}
                      </button>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleEditInvitation(inv)}
                      >
                        Redigera
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteInvitation(inv)}
                      >
                        Ta bort
                      </button>
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
            {guests.length > 0 && (
              <button className={styles.previewBtn} type="button" onClick={exportGuests}>
                Exportera gästlänkar
              </button>
            )}
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
                      {guest.email && (
                        <p className={styles.invitationLocation}>✉️ {guest.email}</p>
                      )}
                      {guest.phone && (
                        <p className={styles.invitationLocation}>☎ {guest.phone}</p>
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
                <label className={styles.label}>Telefonnummer</label>
                <input
                  className={styles.input}
                  type="tel"
                  placeholder="T.ex. 0701234567"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
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

            <div className={styles.importBox}>
              <h2 className={styles.importTitle}>Importera gäster från CSV</h2>
              <p className={styles.importHelp}>
                CSV-filen ska ha kolumnerna: name,email,phone. Välj inbjudan ovan först.
              </p>
              <input
                className={styles.input}
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFile}
              />
              {csvMessage && <p className={styles.success}>{csvMessage}</p>}
              {csvGuests.length > 0 && (
                <div className={styles.csvPreview}>
                  {csvGuests.slice(0, 5).map((guest, index) => (
                    <p key={`${guest.email}-${index}`}>
                      {guest.name} · {guest.email || 'ingen email'} · {guest.phone || 'inget nummer'}
                    </p>
                  ))}
                  {csvGuests.length > 5 && <p>...och {csvGuests.length - 5} till</p>}
                </div>
              )}
              <button className={styles.submitBtn} type="button" onClick={handleImportGuests}>
                Importera gäster
              </button>
            </div>
          </div>
        )}

      </div>

      {previewOpen && (
        <div className={styles.previewModal} role="dialog" aria-modal="true" aria-label="Förhandsvisning">
          <button className={styles.closePreview} onClick={() => setPreviewOpen(false)}>
            Stäng
          </button>
          <div className={styles.fullPreview}>
            {formData.video_background && (
              <video
                className={styles.fullPreviewVideo}
                src={formData.video_background}
                autoPlay
                muted
                loop
                playsInline
              />
            )}
            <div className={styles.fullPreviewShade}></div>
            <div className={styles.fullPreviewContent}>
              <small>Du är inbjuden</small>
              <h2>{formData.title || 'Era namn'}</h2>
              <p>{formData.location || 'Er plats'}</p>
              <div className={styles.miniProgramme}>
                {formData.programme.filter((item) => item.time || item.activity).map((item, index) => (
                  <span key={index}>{item.time} {item.activity}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
