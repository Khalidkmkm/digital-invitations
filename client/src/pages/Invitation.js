import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Invitation.module.css';
import { apiUrl } from '../config/api';

const demoInvitation = {
  title: 'Isabella & Alexander',
  event_date: '2027-06-14T15:00:00',
  location: 'Rosendals Trädgård, Stockholm',
  dress_code: 'Sommarfin',
  language: 'SV',
  video_background: '/videos/background.mp4',
  music_file: '/music/background.mp3',
  programme: [
    { time: '15.00', activity: 'Vigsel i trädgården' },
    { time: '16.00', activity: 'Mingel & fotografi' },
    { time: '18.00', activity: 'Middag' },
    { time: '21.00', activity: 'Tårta & dans' }
  ],
  hotels: [
    { name: 'Hotel Hasselbacken', distance: '8 minuters promenad', url: 'https://www.google.com/maps/search/?api=1&query=Hotel+Hasselbacken+Stockholm' },
    { name: 'Backstage Hotel', distance: '10 minuters promenad', url: 'https://www.google.com/maps/search/?api=1&query=Backstage+Hotel+Stockholm' }
  ]
};

const translations = {
  SV: {
    invited: 'Du är inbjuden',
    open: 'Öppna inbjudan',
    countdown: 'Nedräkning',
    days: 'Dagar',
    hours: 'Timmar',
    minutes: 'Minuter',
    seconds: 'Sekunder',
    dresscode: 'Klädkod',
    dressNote: 'Undvik att bära vitt',
    programme: 'Dagsprogram',
    hotels: 'Hotellrekommendationer',
    rsvp: 'OSA',
    attending: 'Jag kommer',
    notAttending: 'Kan ej komma',
    dietary: 'Matpreferenser / Allergier',
    messagePlaceholder: 'Meddelande till värdparet...',
    send: 'Skicka svar',
    rsvpSent: 'Tack för ditt svar! 🎉',
    mapsBtn: 'Öppna i Google Maps',
    book: 'Boka här',
    retry: 'Testa igen',
    demo: 'Demoinbjudan'
  },
  EN: {
    invited: 'You are invited',
    open: 'Open invitation',
    countdown: 'Countdown',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    dresscode: 'Dress Code',
    dressNote: 'Please avoid wearing white',
    programme: 'Day Programme',
    hotels: 'Hotel Recommendations',
    rsvp: 'RSVP',
    attending: 'I will attend',
    notAttending: 'Cannot attend',
    dietary: 'Dietary requirements',
    messagePlaceholder: 'Message to the hosts...',
    send: 'Send reply',
    rsvpSent: 'Thank you for your reply! 🎉',
    mapsBtn: 'Open in Google Maps',
    book: 'Book here',
    retry: 'Try again',
    demo: 'Demo invitation'
  },
  SO: {
    invited: 'Waa lagu casuumay',
    open: 'Fur casuumadda',
    countdown: 'Tirinta wakhtiga',
    days: 'Maalmood',
    hours: 'Saacadood',
    minutes: 'Daqiiqado',
    seconds: 'Ilbiriqsiyo',
    dresscode: 'Labiska',
    dressNote: 'Fadlan ha xiran dhar cad',
    programme: 'Barnaamijka maalinta',
    hotels: 'Hoteellada lagu taliyay',
    rsvp: 'Xaqiiji imaanshaha',
    attending: 'Waan imanayaa',
    notAttending: 'Ma iman karo',
    dietary: 'Cunto gaar ah / Xasaasiyad',
    messagePlaceholder: 'Farriin u reeb lammaanaha...',
    send: 'Dir jawaabta',
    rsvpSent: 'Waad ku mahadsan tahay jawaabtaada! 🎉',
    mapsBtn: 'Ka fur Google Maps',
    book: 'Halkan ka qabso',
    retry: 'Mar kale tijaabi',
    demo: 'Casuumaad tijaabo ah'
  }
};

const dateLocales = {
  SV: 'sv-SE',
  EN: 'en-GB'
};

const somaliWeekdays = ['Axad', 'Isniin', 'Talaado', 'Arbaco', 'Khamiis', 'Jimco', 'Sabti'];
const somaliMonths = [
  'Janaayo', 'Febraayo', 'Maarso', 'Abriil', 'Maajo', 'Juun',
  'Luulyo', 'Agoosto', 'Sebteembar', 'Oktoobar', 'Nofeembar', 'Diseembar'
];

function Invitation() {
  const { code } = useParams();
  const isDemo = code === 'demo';
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('SV');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [rsvpData, setRsvpData] = useState({
    rsvp_status: 'attending',
    dietary_requirements: '',
    bringing_children: false,
    message: ''
  });
  const [rsvpSent, setRsvpSent] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    setIsOpen(false);
    setIsOpening(false);
    setRsvpSent(false);

    if (isDemo) {
      setInvitation(demoInvitation);
      setLanguage(demoInvitation.language);
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      setLoading(true);
      try {
        const response = await axios.get(apiUrl(`/api/guests/invitation/${code}`));
        setInvitation(response.data);
        setLanguage(response.data.language || 'SV');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [code, isDemo]);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!invitation) return;
    const interval = setInterval(() => {
      const eventDate = new Date(invitation.event_date);
      const now = new Date();
      const diff = eventDate - now;
      if (diff <= 0) return;
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [invitation]);

  const handleRSVP = async (e) => {
    e.preventDefault();
    if (isDemo) {
      setRsvpSent(true);
      return;
    }

    try {
      await axios.put(apiUrl(`/api/guests/rsvp/${code}`), rsvpData);
      setRsvpSent(true);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (musicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setMusicPlaying(!musicPlaying);
    }
  };

  const openInvitation = () => {
    if (isOpening) return;
    setIsOpening(true);
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setMusicPlaying(true))
        .catch(() => setMusicPlaying(false));
    }
    window.setTimeout(() => setIsOpen(true), 900);
  };

  const t = translations[language] || translations.SV;
  const eventDate = new Date(invitation?.event_date);
  const formattedEventDate = language === 'SO'
    ? `${somaliWeekdays[eventDate.getDay()]}, ${eventDate.getDate()} ${somaliMonths[eventDate.getMonth()]} ${eventDate.getFullYear()}`
    : eventDate.toLocaleDateString(
        dateLocales[language] || dateLocales.SV,
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      );

  if (loading) return <div className={styles.loading}>Laddar inbjudan...</div>;
  if (!invitation) return <div className={styles.notFound}>Inbjudan hittades inte.</div>;

  return (
    <div className={styles.container}>
      {!isOpen && (
        <div className={`${styles.envelopeIntro} ${isOpening ? styles.introOpening : ''}`}>
          <p className={styles.envelopeLabel}>{t.invited}</p>
          <button
            className={`${styles.envelope} ${isOpening ? styles.envelopeOpening : ''}`}
            onClick={openInvitation}
            aria-label={t.open}
          >
            <span className={styles.envelopeBack}></span>
            <span className={styles.letter}>
              <small>{t.invited}</small>
              <strong>{invitation.title}</strong>
            </span>
            <span className={styles.envelopeFront}></span>
            <span className={styles.envelopeFlap}></span>
            <span className={styles.waxSeal}>
              {invitation.title.trim().charAt(0)}
            </span>
          </button>
          <button className={styles.openButton} onClick={openInvitation}>
            {t.open}
          </button>
        </div>
      )}

      {invitation.video_background && (
        <video
          className={styles.videoBg}
          src={invitation.video_background}
          autoPlay
          muted
          loop
          playsInline
        />
      )}

      {invitation.music_file && (
        <audio ref={audioRef} src={invitation.music_file} loop />
      )}

      <div className={`${styles.invitationContent} ${isOpen ? styles.invitationVisible : ''}`}>
      <div className={styles.hero}>
        <div className={styles.langToggle}>
          <button
            className={language === 'SV' ? styles.langBtnActive : styles.langBtn}
            onClick={() => setLanguage('SV')}
          >SV</button>
          <button
            className={language === 'EN' ? styles.langBtnActive : styles.langBtn}
            onClick={() => setLanguage('EN')}
          >EN</button>
          <button
            className={language === 'SO' ? styles.langBtnActive : styles.langBtn}
            onClick={() => setLanguage('SO')}
          >SO</button>
        </div>

        <div className={styles.guestCode}>
          {isDemo ? t.demo : `Gästkod: #${code}`}
        </div>
        <p className={styles.badge}>{t.invited}</p>
        <div className={styles.divider}></div>
        <h1 className={styles.title}>{invitation.title}</h1>
        <div className={styles.divider}></div>
        <p className={styles.eventDate}>{formattedEventDate}</p>

        {invitation.music_file && (
          <button className={styles.musicBtn} onClick={toggleMusic}>
            {musicPlaying ? '♫' : '♪'}
          </button>
        )}
      </div>

      <div className={styles.countdownSection}>
        <p className={styles.sectionLabel}>{t.countdown}</p>
        <div className={styles.countdown}>
          <div className={styles.countItem}>
            <span className={styles.countNum}>{countdown.days}</span>
            <span className={styles.countLabel}>{t.days}</span>
          </div>
          <span className={styles.countSep}>:</span>
          <div className={styles.countItem}>
            <span className={styles.countNum}>{String(countdown.hours).padStart(2,'0')}</span>
            <span className={styles.countLabel}>{t.hours}</span>
          </div>
          <span className={styles.countSep}>:</span>
          <div className={styles.countItem}>
            <span className={styles.countNum}>{String(countdown.minutes).padStart(2,'0')}</span>
            <span className={styles.countLabel}>{t.minutes}</span>
          </div>
          <span className={styles.countSep}>:</span>
          <div className={styles.countItem}>
            <span className={styles.countNum}>{String(countdown.seconds).padStart(2,'0')}</span>
            <span className={styles.countLabel}>{t.seconds}</span>
          </div>
        </div>
      </div>

      <div className={styles.dresscodeSection}>
        <p className={styles.sectionLabel}>{t.dresscode}</p>
        <p className={styles.dresscodeTitle}>{invitation.dress_code}</p>
        <p className={styles.dresscodeSub}>{t.dressNote}</p>
      </div>

      <div className={styles.locationSection}>
        <div className={styles.mapPlaceholder}>
          <p>📍 {invitation.location}</p>
        </div>

        <a
          className={styles.mapsBtn}
          href={`https://maps.google.com/?q=${encodeURIComponent(invitation.location)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.mapsBtn}
        </a>
      </div>

      {/* Day Programme */}
      {invitation.programme && invitation.programme.length > 0 && (
        <div className={styles.programmeSection}>
          <p className={styles.sectionLabel}>{t.programme}</p>
          <div className={styles.timeline}>
            {invitation.programme.map((item, index) => (
              <div key={index} className={styles.timelineItem}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineContent}>
                  <p className={styles.timelineTime}>{item.time}</p>
                  <p className={styles.timelineTitle}>{item.activity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotellrekommendationer */}
      {invitation.hotels && invitation.hotels.length > 0 && (
        <div className={styles.hotelsSection}>
          <p className={styles.sectionLabel}>{t.hotels}</p>
          <div className={styles.hotelsList}>
            {invitation.hotels.map((hotel, index) => (
              <div key={index} className={styles.hotelItem}>
                <p className={styles.hotelName}>{hotel.name}</p>
                <p className={styles.hotelDistance}>{hotel.distance}</p>
                {hotel.url && (

                  <a
                    className={styles.hotelLink}
                    href={hotel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.book}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.rsvpSection}>
        <h2 className={styles.rsvpTitle}>{t.rsvp}</h2>
        {rsvpSent ? (
          <div className={styles.rsvpConfirmation}>
            <p className={styles.rsvpSuccess}>{t.rsvpSent}</p>
            {isDemo && (
              <button
                className={styles.resetDemo}
                onClick={() => setRsvpSent(false)}
              >
                {t.retry}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleRSVP} className={styles.rsvpForm}>
            <div className={styles.rsvpButtons}>
              <button
                type="button"
                className={rsvpData.rsvp_status === 'attending' ? styles.rsvpBtnActive : styles.rsvpBtn}
                onClick={() => setRsvpData({...rsvpData, rsvp_status: 'attending'})}
              >
                {t.attending}
              </button>
              <button
                type="button"
                className={rsvpData.rsvp_status === 'not_attending' ? styles.rsvpBtnActive : styles.rsvpBtn}
                onClick={() => setRsvpData({...rsvpData, rsvp_status: 'not_attending'})}
              >
                {t.notAttending}
              </button>
            </div>

            <input
              className={styles.rsvpInput}
              type="text"
              placeholder={t.dietary}
              value={rsvpData.dietary_requirements}
              onChange={(e) => setRsvpData({...rsvpData, dietary_requirements: e.target.value})}
            />

            <textarea
              className={styles.rsvpInput}
              placeholder={t.messagePlaceholder}
              rows="3"
              value={rsvpData.message}
              onChange={(e) => setRsvpData({...rsvpData, message: e.target.value})}
            />

            <button className={styles.rsvpSubmit} type="submit">
              {t.send}
            </button>
          </form>
        )}
      </div>
      </div>

    </div>
  );
}

export default Invitation;
