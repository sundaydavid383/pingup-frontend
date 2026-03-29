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

/**
 * MoodProvider - Global mood/audio state manager for background music.
 *
 * Key design decisions to prevent multiple moods playing simultaneously:
 * - Uses a generation counter (playGenerationRef) that increments on each playMood call.
 *   When an audio's oncanplaythrough fires, it checks its generation against the current one.
 *   If they don't match, the audio is stale and won't play.
 * - Stops current audio synchronously BEFORE creating a new Audio instance.
 * - Calls audio.play() immediately after setup; oncanplaythrough is a fallback.
 * - Single audioRef ensures only one Audio instance exists at any time.
 */
export function MoodProvider({ children }) {
  // Persisted state - load from localStorage on mount
  const [volume, setVolumeState] = useState(() => loadFromStorage(STORAGE_KEYS.volume, DEFAULT_VOLUME));
  const [selectedMood, setSelectedMoodState] = useState(() => loadFromStorage(STORAGE_KEYS.selectedMood, ''));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMoodId, setCurrentMoodId] = useState(null);

  // Audio ref - single global audio instance
  const audioRef = useRef(null);

  // Generation counter to prevent stale audio callbacks from playing
  // Each call to playMood increments this; callbacks check their generation
  const playGenerationRef = useRef(0);

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

  /**
   * Internal helper: fully stop and clean up the current audio instance.
   * Called before creating a new audio to guarantee only one mood plays.
   */
  const stopCurrentAudio = useCallback(() => {
    if (audioRef.current) {
      // Remove event listeners to prevent stale callbacks
      audioRef.current.oncanplaythrough = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      // Stop playback
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Release the audio resource
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  /**
   * Play a mood - stops any currently playing audio first.
   *
   * Race-condition prevention:
   * 1. Increment generation counter - any previous callbacks become stale.
   * 2. Stop current audio synchronously (pause + cleanup).
   * 3. Create new audio and assign to audioRef.
   * 4. Play immediately; oncanplaythrough is a fallback for slow loads.
   * 5. Each callback checks audioRef.current === audio AND generation match.
   */
  const playMood = useCallback((moodId) => {
    const mood = MOODS.find(m => m.id === moodId);
    if (!mood?.file) return;

    // Increment generation - invalidates any pending callbacks from previous play
    playGenerationRef.current += 1;
    const thisGeneration = playGenerationRef.current;

    // Stop current audio synchronously - ensures no overlap
    stopCurrentAudio();

    // Create new audio instance
    const audio = new Audio(mood.file);
    audio.loop = true;
    audio.volume = mood.defaultVolume ?? volume;

    setIsLoading(true);
    setCurrentMoodId(moodId);
    setSelectedMood(mood.name);

    // Assign to ref immediately so other code sees the new audio
    audioRef.current = audio;

    // Guard: only play if this audio instance is still the active one
    // AND this play call hasn't been superseded by a newer one.
    const tryPlay = () => {
      if (audioRef.current !== audio) return; // Stale instance
      if (playGenerationRef.current !== thisGeneration) return; // Superseded by newer play call
      setIsLoading(false);
      setIsPlaying(true);
      audio.play().catch(err => {
        console.error('Audio play failed:', err);
        if (audioRef.current === audio) setIsPlaying(false);
      });
    };

    // Primary: play as soon as audio can play through
    audio.oncanplaythrough = tryPlay;

    // Fallback: if oncanplaythrough doesn't fire (e.g., cached audio),
    // try playing after a short delay
    const fallbackTimer = setTimeout(() => {
      if (audioRef.current === audio && audio.paused && playGenerationRef.current === thisGeneration) {
        tryPlay();
      }
    }, 100);

    audio.onended = () => {
      if (audioRef.current === audio) setIsPlaying(false);
    };
    audio.onerror = () => {
      if (audioRef.current === audio) {
        setIsLoading(false);
        setIsPlaying(false);
      }
      console.error('Audio load error');
    };

    saveToStorage(STORAGE_KEYS.selectedMood, mood.name);

    // Cleanup fallback timer when audio loads or component changes
    audio.addEventListener('canplaythrough', () => clearTimeout(fallbackTimer), { once: true });

    return () => clearTimeout(fallbackTimer);
  }, [volume, stopCurrentAudio, setSelectedMood]);

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

  // Stop audio completely and reset state
  const stopAudio = useCallback(() => {
    playGenerationRef.current += 1; // Invalidate any pending play callbacks
    stopCurrentAudio();
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentMoodId(null);
  }, [stopCurrentAudio]);

  // Restore previous mood on mount (don't auto-play, just set selection)
  useEffect(() => {
    const savedMood = loadFromStorage(STORAGE_KEYS.selectedMood, '');
    if (savedMood) {
      const mood = MOODS.find(m => m.name === savedMood);
      if (mood) {
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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, [stopCurrentAudio]);

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
