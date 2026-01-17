import React, { useState, useRef, useEffect } from "react";
import "../../styles/biblecontrols.css";

/* ============================
   GLOBAL AUDIO SINGLETON
   (TRUE SOURCE OF TRUTH)
   ============================ */
let globalMoodAudio = null;
let globalMoodName = null;

/* ============================
   MOODS
   ============================ */
const moods = [
  { name: "Calm", file: "/audio/calm.mp3" },
  { name: "Grateful", file: "/audio/grateful.mp3" },
  { name: "Thoughtful", file: "/audio/thoughtful.mp3" },
  { name: "Awakening", file: "/audio/awakening.mp3" },
  { name: "Cinematic", file: "/audio/cinematic.mp3" },
  { name: "Relax", file: "/audio/relax.mp3" },
  { name: "Epic", file: "/audio/epic.mp3" },
];

const CALM_VOLUME = 0.6;
const DEFAULT_VOLUME = 0.3;

export default function MoodSelector({ moodVolume, setMoodVolume }) {
  /* ============================
     UI STATE (MIRROR ONLY)
     ============================ */
  const [selectedMood, setSelectedMood] = useState("");
  const [searchText, setSearchText] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredMoods = moods.filter((m) =>
    m.name.toLowerCase().includes(searchText.toLowerCase())
  );

  /* ============================
     PLAY / REPLACE / TOGGLE
     (ONLY ENTRY POINT)
     ============================ */
  const playMood = (mood) => {
    if (!mood?.file) return;

    console.log("[Mood] playMood:", mood.name);

    // SAME mood → toggle
    if (globalMoodAudio && globalMoodName === mood.name) {
      if (globalMoodAudio.paused) {
        globalMoodAudio.play().catch(() => {});
        setIsPlaying(true);
      } else {
        globalMoodAudio.pause();
        setIsPlaying(false);
      }
      return;
    }

    // DIFFERENT mood → HARD replace
    if (globalMoodAudio) {
      globalMoodAudio.pause();
      globalMoodAudio.currentTime = 0;
    }

    const audio = new Audio(mood.file);
    audio.loop = true;
    audio.volume =
      mood.name.toLowerCase() === "calm"
        ? CALM_VOLUME
        : moodVolume ?? DEFAULT_VOLUME;

    audio.play().catch(() => {});

    globalMoodAudio = audio;
    globalMoodName = mood.name;

    setSelectedMood(mood.name);
    setSearchText(mood.name);
    setIsPlaying(true);
    setIsDropdownOpen(false);

    localStorage.setItem("selectedMood", mood.name);
  };

  /* ============================
     INPUT SIDE TOGGLE
     ============================ */
  const toggleInputPlay = () => {
    if (!globalMoodAudio) return;

    if (globalMoodAudio.paused) {
      globalMoodAudio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      globalMoodAudio.pause();
      setIsPlaying(false);
    }
  };

  /* ============================
     SYNC UI ON MOUNT
     (NO AUTOPLAY)
     ============================ */
  useEffect(() => {
    const savedMood = localStorage.getItem("selectedMood");
    const savedVolume = localStorage.getItem("moodVolume");

    if (savedVolume !== null) {
      setMoodVolume(Number(savedVolume));
    }

    // Sync UI with REAL audio state
    if (globalMoodAudio && globalMoodName) {
      setSelectedMood(globalMoodName);
      setSearchText(globalMoodName);
      setIsPlaying(!globalMoodAudio.paused);
      return;
    }

    // No active audio → just restore UI label
    if (savedMood) {
      setSelectedMood(savedMood);
      setSearchText(savedMood);
    }
  }, []);

  /* ============================
     LIVE VOLUME SYNC
     ============================ */
  useEffect(() => {
    if (globalMoodAudio) {
      globalMoodAudio.volume = moodVolume;
    }
    localStorage.setItem("moodVolume", moodVolume);
  }, [moodVolume]);

  /* ============================
     OUTSIDE CLICK
     ============================ */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ============================
     UI
     ============================ */
  return (
    <div className="mood-selector-container">
      <label className="mood-label">Mood</label>

      <div className="mood-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          placeholder="Select mood..."
          value={searchText}
          onClick={() => setIsDropdownOpen(true)}
          onChange={(e) => setSearchText(e.target.value)}
          className="mood-input"
        />

        {selectedMood && (
          <button
            type="button"
            className={`mood-play-btn ${isPlaying ? "playing" : ""}`}
            onClick={toggleInputPlay}
          >
            <span className="eq">
              <span />
              <span />
              <span />
            </span>
          </button>
        )}
      </div>

      {isDropdownOpen && (
        <ul ref={dropdownRef} className="mood-dropdown">
          {filteredMoods.map((m) => {
            const active = selectedMood === m.name;

            return (
              <li
                key={m.name}
                className={`mood-option ${active ? "active" : ""}`}
                onClick={() => playMood(m)} // 🔒 ONLY CLICK
              >
                <span className="mood-name">{m.name}</span>

                <span
                  className={`mood-play-btn ${
                    active && isPlaying ? "playing" : ""
                  }`}
                >
                  <span className="eq">
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
