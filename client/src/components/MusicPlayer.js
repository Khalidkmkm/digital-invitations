import React, { useState, useRef } from 'react';
import styles from '../styles/MusicPlayer.module.css';

function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  function toggleMusic() {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  return (
    <div className={styles.player}>
      <audio ref={audioRef} src="/music/background.mp3" loop />
      <button onClick={toggleMusic}>
        {isPlaying ? '🔊 Musik på' : '🔇 Musik av'}
      </button>
    </div>
  );
}

export default MusicPlayer;