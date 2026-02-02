import React, { useState, useRef, useEffect } from "react";
import "../../styles/biblecontrols.css";

let globalMoodAudio = null;
let globalMoodName = null;

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

const [selectedMood, setSelectedMood] = useState("");
  const [searchText, setSearchText] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ✅ New state

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredMoods = moods.filter((m) =>
    m.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const playMood = (mood) => {
    if (!mood?.file) return;

  // SAME mood → toggle
    if (globalMoodAudio && globalMoodName === mood.name) {
      if (globalMoodAudio.paused) {
        globalMoodAudio.play().catch(() => {});
        setIsPlaying(true);
        setIsLoading(false);
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

    setIsLoading(true); // start loading
    audio.oncanplaythrough = () => {
      setIsLoading(false); // loaded
      setIsPlaying(true);
      audio.play().catch(() => {});
    };

    audio.onended = () => setIsPlaying(false);
   globalMoodAudio = audio;
    globalMoodName = mood.name;

    setSelectedMood(mood.name);
    setSearchText(mood.name);

 setIsDropdownOpen(false);

    localStorage.setItem("selectedMood", mood.name);
  };

const toggleInputPlay = () => {
  if (!globalMoodAudio) return;

  // If paused → try to play
  if (globalMoodAudio.paused) {
    setIsLoading(true); // show loader
    globalMoodAudio.play()
      .then(() => {
        setIsPlaying(true);   // now it is actually playing
        setIsLoading(false);  // hide loader
      })
      .catch((err) => {
        console.error("Audio play failed:", err);
        setIsPlaying(false);
        setIsLoading(false);
      });
  } else {
    // If playing → pause
    globalMoodAudio.pause();
    setIsPlaying(false);
    setIsLoading(false); // make sure loader is hidden
  }
};

useEffect(() => {
    const savedMood = localStorage.getItem("selectedMood");
    const savedVolume = localStorage.getItem("moodVolume");
    if (savedVolume !== null) setMoodVolume(Number(savedVolume));

 if (globalMoodAudio && globalMoodName) {
      setSelectedMood(globalMoodName);
      setSearchText(globalMoodName);
      setIsPlaying(!globalMoodAudio.paused);
      return;
    }

 if (savedMood) {
      setSelectedMood(savedMood);
      setSearchText(savedMood);
    }
  }, []);


  useEffect(() => {
    if (globalMoodAudio) globalMoodAudio.volume = moodVolume;
    localStorage.setItem("moodVolume", moodVolume);
  }, [moodVolume]);

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
            className={`mood-play-btn ${
              isLoading ? "loading" : isPlaying ? "playing" : ""
            }`}
            onClick={toggleInputPlay}
          >
            {isLoading ? (
              <span className="loader"></span> // small animation
            ) : isPlaying ? (
              <span className="eq">
                <span />
                <span />
                <span />
              </span>
            ) : (
              <span className="text-[var(--gold)]">▶</span> // play button
            )}
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
                onClick={() => playMood(m)}
              >
                <span className="mood-name">{m.name}</span>
   <span
                  className={`mood-play-btn ${
                    active && isPlaying ? "playing" : ""
                  }`}
                >
                  {active && isPlaying ? (
                    <span className="eq">
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : (
                    <span>▶</span>
                  )}
       </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
