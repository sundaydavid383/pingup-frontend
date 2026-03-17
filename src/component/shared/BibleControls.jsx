// BibleControls.jsx
import React, { useRef, useState, useEffect } from "react";
import { FaVolumeUp, FaMusic, FaClock } from "react-icons/fa";
import MoodSelector from "./MoodSelector";
import "../../styles/biblecontrols.css";

export default function BibleControls({
  ttsSpeed,
  setTtsSpeed,
  progress,
  setProgress,
  ttsRef,
  isVisible = false,
}) {
  const speedRef = useRef(null);
  const [moodVolume, setMoodVolume] = useState(0.3);
  
  // Popover states
  const [openPopover, setOpenPopover] = useState(null);
  const popoverRef = useRef(null);

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
    isSeekingRef.current = true;
    setProgress(val);
  };

  const handleProgressCommit = () => {
    if (!ttsRef?.current) return;
    console.log("▶ Seek commit → jumpToPercent");
    ttsRef.current.jumpToPercent(progress);
    isSeekingRef.current = false;
  };

  /* -------------------------------
     Reading speed
  -------------------------------*/
  const handleSpeedChange = (e) => {
    const val = parseFloat(e.target.value);
    setTtsSpeed(val);

    if (ttsRef?.current) {
      console.log("⏹ Pausing TTS to apply new speed");
      ttsRef.current.pauseForSpeedChange(val);
    }
  };

  /* -------------------------------
     Mood volume
  -------------------------------*/
  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setMoodVolume(val);
  };

  /* -------------------------------
     Close popovers when clicking outside
  -------------------------------*/
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpenPopover(null);
      }
    };

    if (openPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openPopover]);

  const togglePopover = (popoverName) => {
    setOpenPopover(openPopover === popoverName ? null : popoverName);
  };

  return (
    <div className={`bible-controls-bar ${isVisible ? 'visible' : 'hidden'}`} ref={popoverRef}>
      <div className="bible-controls-inner">
        {/* Chapter Progress - Main Focus */}
        <div className="progress-section">
          <div className="progress-control horizontal">
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
              className="chapter-progress-slider"
            />
            <span className="progress-value">{progress}%</span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="controls-right">
          {/* Speed Control */}
          <div className="control-icon-wrapper" ref={speedRef}>
            <button 
              className={`control-icon-btn ${openPopover === 'speed' ? 'active' : ''}`}
              onClick={() => togglePopover('speed')}
              title="Reading Speed"
            >
              <FaClock />
              <span className="icon-label">{ttsSpeed}×</span>
            </button>
            {openPopover === 'speed' && (
              <div className="popover-slider speed-popover">
                <label className="popover-label">Reading Speed</label>
                <div className="popover-slider-inner">
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
                  <span className="popover-value">{ttsSpeed}×</span>
                </div>
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="control-icon-wrapper">
            <button 
              className={`control-icon-btn ${openPopover === 'volume' ? 'active' : ''}`}
              onClick={() => togglePopover('volume')}
              title="Mood Volume"
            >
              <FaVolumeUp />
              <span className="icon-label">{Math.round(moodVolume * 100)}%</span>
            </button>
            {openPopover === 'volume' && (
              <div className="popover-slider volume-popover">
                <label className="popover-label">Mood Volume</label>
                <div className="popover-slider-inner">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={moodVolume}
                    onChange={handleVolumeChange}
                    style={{ background: getSliderBackground(moodVolume * 100) }}
                  />
                  <span className="popover-value">{Math.round(moodVolume * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Mood Selector */}
          <div className="control-icon-wrapper">
            <button 
              className={`control-icon-btn ${openPopover === 'mood' ? 'active' : ''}`}
              onClick={() => togglePopover('mood')}
              title="Background Mood"
            >
              <FaMusic />
              <span className="icon-label">Mood</span>
            </button>
            {openPopover === 'mood' && (
              <div className="popover-slider mood-popover">
                <MoodSelector moodVolume={moodVolume} setMoodVolume={setMoodVolume} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
