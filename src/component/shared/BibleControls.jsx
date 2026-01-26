import React, { useRef, useState } from "react";
import { FaSearch, FaVolumeUp } from "react-icons/fa";
import MoodSelector from "./MoodSelector";
import "../../styles/biblecontrols.css";
import { useAuth } from "../../context/AuthContext";

export default function BibleControls({
  ttsSpeed,
  setTtsSpeed,
  progress,
  setProgress,
  ttsRef, // ChapterTTS ref
}) {
  const speedRef = useRef(null);
  const [moodVolume, setMoodVolume] = useState(0.3);
  const { sidebarOpen } = useAuth();

  // Prevent progress conflicts while dragging
  const isSeekingRef = useRef(false);

  /* -------------------------------
     Slider background helper
  -------------------------------*/
  const getSliderBackground = (value, max = 100) =>
    `linear-gradient(
      to right,
      var(--hover-light) 0%,
      var(--hover-dark) ${value}%,
      rgba(255,255,255,0.15) ${value}%,
      rgba(255,255,255,0.15) 100%
    )`;

  /* -------------------------------
     Progress seeking (video-like)
  -------------------------------*/
  const handleProgressChange = (e) => {
    const val = Number(e.target.value);
    isSeekingRef.current = true; // mark that user is actively seeking
    setProgress(val); // visually update slider immediately
  };

  const handleProgressCommit = () => {
    if (!ttsRef?.current) return;

    console.log("▶ Seek commit → jumpToPercent");
    ttsRef.current.jumpToPercent(progress); // tell ChapterTTS to seek
    isSeekingRef.current = false; // done seeking
  };

  /* -------------------------------
     Reading speed
  -------------------------------*/
  const handleSpeedChange = (e) => {
    const val = parseFloat(e.target.value);
    setTtsSpeed(val);

    if (ttsRef?.current) {
      console.log("⏹ Pausing TTS to apply new speed");
      ttsRef.current.pauseForSpeedChange(val); // ChapterTTS handles restart
    }
  };

  /* -------------------------------
     Mood volume
  -------------------------------*/
  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setMoodVolume(val);
    // volume applies automatically on next utterance
  };

  return (
    <div className="bible-controls-fixed "  style={{
    left: sidebarOpen ? "20rem" : ".1rem", // shifts with sidebar
    transition: "left 0.3s ease",         // smooth animation
  }}>
      <div className="dropdown speed-dropdown" ref={speedRef}>
        {/* Progress */}
        <label className="speed-label">Chapter Progress</label>
        <div className="speed-control horizontal" style={{ marginTop: "10px" }}>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={progress}
            onChange={handleProgressChange}
            onMouseUp={handleProgressCommit}
            onTouchEnd={handleProgressCommit}
            style={{ background: getSliderBackground(progress) }}
          />
          <span style={{ fontSize: "0.8rem" }}>{progress}%</span>
        </div>

        {/* Reading Speed */}
        <label className="speed-label">Reading Speed</label>
        <div className="speed-control horizontal">
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={ttsSpeed}
            onChange={handleSpeedChange}
            style={{
              background: getSliderBackground(((ttsSpeed - 0.5) / 1) * 100),
            }}
          />
          <span className="speed-value">{ttsSpeed}×</span>
        </div>

        {/* Mood Volume */}
        <label className="speed-label">Mood Volume</label>
        <div className="speed-control horizontal">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={moodVolume}
            onChange={handleVolumeChange}
            style={{ background: getSliderBackground(moodVolume * 100) }}
          />
          <span style={{ fontSize: "0.75rem" }}>
            {Math.round(moodVolume * 100)}%
          </span>
        </div>

        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--gold)",
            marginTop: "4px",
          }}
        >
          ⚠ Speed & volume apply instantly or on next play.
        </p>
      </div>

      <MoodSelector moodVolume={moodVolume} setMoodVolume={setMoodVolume} />
    </div>
  );
}