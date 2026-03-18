// MoodSelector.jsx - Integrated with Global MoodStore
import React, { useState, useRef, useEffect } from "react";
import { useMoodStore, MOODS } from "../../store/MoodStore";
import "../../styles/biblecontrols.css";

export default function MoodSelector({ moodVolume, setMoodVolume }) {
  // Use global mood store instead of local state
  const {
    volume,
    selectedMood,
    currentMoodId,
    isPlaying,
    isLoading,
    setVolume,
    playMood,
    togglePlayPause,
    moods: storeMoods,
  } = useMoodStore();

  // Local UI state
  const [searchText, setSearchText] = useState(selectedMood || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync searchText when selectedMood changes from store
  useEffect(() => {
    if (selectedMood) {
      setSearchText(selectedMood);
    }
  }, [selectedMood]);

  // Volume change handler - sync with global store
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    // Also call prop callback if provided (for backward compatibility)
    if (setMoodVolume) {
      setMoodVolume(newVolume);
    }
  };

  // Handle mood selection
  const handleMoodSelect = (e, mood) => {
    e.stopPropagation(); // Prevent popover from closing
    playMood(mood.id);
    setSearchText(mood.name);
    setIsDropdownOpen(false);
  };

  // Toggle play/pause
  const handleTogglePlay = () => {
    togglePlayPause();
  };

  const filteredMoods = storeMoods.filter((m) =>
    m.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Close dropdown when clicking outside
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

      {/* Volume Slider - integrated into mood selector */}
      <div className="mood-volume-slider">
        <label className="popover-label">Volume</label>
        <div className="popover-slider-inner">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            style={{ background: `linear-gradient(to right, var(--hover-dark) ${volume * 100}%, rgba(255,255,255,0.15) ${volume * 100}%)` }}
          />
          <span className="popover-value">{Math.round(volume * 100)}%</span>
        </div>
      </div>

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
            onClick={handleTogglePlay}
          >
            {isLoading ? (
              <span className="loader"></span>
            ) : isPlaying ? (
              <span className="eq">
                <span />
                <span />
                <span />
              </span>
            ) : (
              <span className="text-[var(--gold)]">▶</span>
            )}
          </button>
        )}
      </div>

      {isDropdownOpen && (
        <ul ref={dropdownRef} className="mood-dropdown">
          {filteredMoods.map((m) => {
            const isActive = currentMoodId === m.id;

            return (
              <li
                key={m.id}
                className={`mood-option ${isActive ? "active" : ""}`}
                onClick={(e) => handleMoodSelect(e, m)}
              >
                <span className="mood-name">{m.name}</span>
                <span
                  className={`mood-play-btn ${
                    isActive && isPlaying ? "playing" : ""
                  }`}
                >
                  {isActive && isPlaying ? (
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
