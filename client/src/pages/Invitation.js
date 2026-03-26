import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Invitation.module.css';

function Invitation() {
  const { code } = useParams();
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
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/guests/invitation/${code}`);
        setInvitation(response.data);
        setLanguage(response.data.language || 'SV');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [code]);

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
    try {
      await axios.put(`http://localhost:8080/api/guests/rsvp/${code}`, rsvpData);
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

  const t = {
    invited: language === 'SV' ? 'Du är inbjuden' : 'You are invited',
    countdown: language === 'SV' ? 'Nedräkning' : 'Countdown',
    days: language === 'SV' ? 'Dagar' : 'Days',
    hours: language === 'SV' ? 'Timmar' : 'Hours',
    minutes: language === 'SV' ? 'Minuter' : 'Minutes',
    seconds: language === 'SV' ? 'Sekunder' : 'Seconds',
    details: language === 'SV' ? 'Information' : 'Details',
    date: language === 'SV' ? 'Datum & Tid' : 'Date & Time',
    location: language === 'SV' ? 'Plats' : 'Location',
    dresscode: language === 'SV' ? 'Klädkod' : 'Dress Code',
    programme: language === 'SV' ? 'Dagsprogram' : 'Day Programme',
    hotels: language === 'SV' ? 'Hotellrekommendationer' : 'Hotel Recommendations',
    rsvp: language === 'SV' ? 'OSA' : 'RSVP',
    attending: language === 'SV' ? 'Jag kommer' : 'I will attend',
    notAttending: language === 'SV' ? 'Kan ej komma' : 'Cannot attend',
    dietary: language === 'SV' ? 'Matpreferenser / Allergier' : 'Dietary requirements',
    children: language === 'SV' ? 'Tar du med barn?' : 'Bringing children?',
    messagePlaceholder: language === 'SV' ? 'Meddelande till värdparet...' : 'Message to the hosts...',
    send: language === 'SV' ? 'Skicka svar' : 'Send reply',
    rsvpSent: language === 'SV' ? 'Tack för ditt svar! 🎉' : 'Thank you for your reply! 🎉',
    mapsBtn: language === 'SV' ? 'Öppna i Google Maps' : 'Open in Google Maps',
  };

  if (loading) return <div className={styles.loading}>Laddar inbjudan...</div>;
  if (!invitation) return <div className={styles.notFound}>Inbjudan hittades inte.</div>;

  return (
    <div className={styles.container}>

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
        </div>

        <div className={styles.guestCode}>Gästkod: #{code}</div>
        <p className={styles.badge}>{t.invited}</p>
        <div className={styles.divider}></div>
        <h1 className={styles.title}>{invitation.title}</h1>
        <div className={styles.divider}></div>
        <p className={styles.eventDate}>
          {new Date(invitation.event_date).toLocaleDateString(
            language === 'SV' ? 'sv-SE' : 'en-GB',
            { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
          )}
        </p>

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
        <p className={styles.dresscodeSub}>
          {language === 'SV' ? 'Undvik att bära vitt' : 'Please avoid wearing white'}
        </p>
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
                    {language === 'SV' ? 'Boka här' : 'Book here'}
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
          <p className={styles.rsvpSuccess}>{t.rsvpSent}</p>
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
  );
}

export default Invitation;