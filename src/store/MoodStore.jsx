// MoodStore.jsx - Global Mood State with Persistence
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const MoodContext = createContext(null);

// Available moods
export const MOODS = [
  { id: 'calm', name: 'Calm', file: '/audio/calm.mp3', defaultVolume: 0.6 },
  { id: 'grateful', name: 'Grateful', file: '/audio/grateful.mp3' },
  { id: 'thoughtful', name: 'Thoughtful', file: '/audio/thoughtful.mp3' },
  { id: 'awakening', name: 'Awakening', file: '/audio/awakening.mp3' },
  { id: 'cinematic', name: 'Cinematic', file: '/audio/cinematic.mp3' },
  { id: 'relax', name: 'Relax', file: '/audio/relax.mp3' },
  { id: 'epic', name: 'Epic', file: '/audio/epic.mp3' },
];

const DEFAULT_VOLUME = 0.3;
const STORAGE_KEYS = {
  volume: 'moodVolume',
  selectedMood: 'selectedMood',
  isPlaying: 'moodIsPlaying',
};

// Load from localStorage with fallback
const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      return key === 'moodVolume' ? Number(stored) : stored;
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }
  return defaultValue;
};

// Save to localStorage
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
};

export function MoodProvider({ children }) {
  // Persisted state - load from localStorage on mount
  const [volume, setVolumeState] = useState(() => loadFromStorage(STORAGE_KEYS.volume, DEFAULT_VOLUME));
  const [selectedMood, setSelectedMoodState] = useState(() => loadFromStorage(STORAGE_KEYS.selectedMood, ''));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMoodId, setCurrentMoodId] = useState(null);

  // Audio ref - single global audio instance
  const audioRef = useRef(null);

  // Sync volume to localStorage and apply to audio
  const setVolume = useCallback((newVolume) => {
    const val = typeof newVolume === 'number' ? newVolume : Number(newVolume);
    setVolumeState(val);
    saveToStorage(STORAGE_KEYS.volume, val);
    
    // Apply to playing audio immediately
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  }, []);

  // Sync selected mood to localStorage
  const setSelectedMood = useCallback((moodName) => {
    setSelectedMoodState(moodName);
    saveToStorage(STORAGE_KEYS.selectedMood, moodName);
  }, []);

  // Play a mood - stops any currently playing audio first
  const playMood = useCallback((moodId) => {
    const mood = MOODS.find(m => m.id === moodId);
    if (!mood?.file) return;

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Create new audio instance
    const audio = new Audio(mood.file);
    audio.loop = true;
    audio.volume = mood.defaultVolume ?? volume;
    
    setIsLoading(true);
    setCurrentMoodId(moodId);
    setSelectedMood(mood.name);

    audio.oncanplaythrough = () => {
      setIsLoading(false);
      setIsPlaying(true);
      audio.play().catch(err => {
        console.error('Audio play failed:', err);
        setIsPlaying(false);
      });
    };

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error('Audio load error');
    };

    audioRef.current = audio;
    saveToStorage(STORAGE_KEYS.selectedMood, mood.name);
  }, [volume]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) {
      // If no audio but we have a selected mood, play it
      if (selectedMood) {
        const mood = MOODS.find(m => m.name === selectedMood);
        if (mood) {
          playMood(mood.id);
          return;
        }
      }
      return;
    }

    if (audioRef.current.paused) {
      setIsLoading(true);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Play failed:', err);
          setIsPlaying(false);
          setIsLoading(false);
        });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [selectedMood, playMood]);

  // Stop audio completely
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentMoodId(null);
  }, []);

  // Restore previous mood on mount (after a short delay to ensure audio is ready)
  useEffect(() => {
    const savedMood = loadFromStorage(STORAGE_KEYS.selectedMood, '');
    if (savedMood) {
      const mood = MOODS.find(m => m.name === savedMood);
      if (mood) {
        // Don't auto-play, just set the selection
        setSelectedMood(savedMood);
        setCurrentMoodId(mood.id);
      }
    }
  }, [setSelectedMood]);

  // Apply volume changes to existing audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const value = {
    // State
    volume,
    selectedMood,
    currentMoodId,
    isPlaying,
    isLoading,
    
    // Actions
    setVolume,
    setSelectedMood,
    playMood,
    togglePlayPause,
    stopAudio,
    
    // Constants
    moods: MOODS,
  };

  return (
    <MoodContext.Provider value={value}>
      {children}
    </MoodContext.Provider>
  );
}

// Hook to use mood store
export function useMoodStore() {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMoodStore must be used within a MoodProvider');
  }
  return context;
}

export default MoodContext;
