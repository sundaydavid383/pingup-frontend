import React, { useEffect, useRef, useState, forwardRef } from "react";
import { Play, Pause } from "lucide-react";
import { useAudioPlayer } from "../../context/AudioPlayerContext";
import "../../styles/voicenotecard.css";

const VoiceNoteCard = forwardRef(({ audioUrl }, forwardedRef) => {
  const {
    currentUrl,
    isPlaying,
    togglePlay,
    progress,
    seek,
    analyserRef,
    setActiveInView,
    audioRef,
    isLoading,
    currentTime,
    duration,
  } = useAudioPlayer();

  // ── Local state for independent timer per card ─────────────────
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration,    setLocalDuration]     = useState(0);

  // ── Refs ───────────────────────────────────────────────────────
  const localAudioRef  = useRef(null);
  const activeAudioRef = audioRef || localAudioRef;
  const canvasRef      = useRef(null);
  const rafRef         = useRef(null);
  const cardRef        = useRef(null);

  // ── Derived state ──────────────────────────────────────────────
  const isThisPlaying = currentUrl === audioUrl && isPlaying;
  const isActive      = isThisPlaying;

  // ── Sync local timer when this card is active ──────────────────
  useEffect(() => {
    if (isThisPlaying) {
      setLocalCurrentTime(currentTime);
      setLocalDuration(duration);
    }
  }, [isThisPlaying, currentTime, duration]);

  // ── Local formatTime ───────────────────────────────────────────
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // ── Forward ref ────────────────────────────────────────────────
  useEffect(() => {
    if (!forwardedRef) return;
    if (typeof forwardedRef === "function") forwardedRef(cardRef.current);
    else forwardedRef.current = cardRef.current;
  }, [forwardedRef]);

  /* ── Visualizer ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!isActive) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const analyser = analyserRef.current;
    const canvas   = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext("2d");

    canvas.width  = canvas.offsetWidth  || 240;
    canvas.height = canvas.offsetHeight || 48;

    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray    = new Uint8Array(bufferLength);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Party gradient: primary-color → primary → color-5 → purple accent
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0,    "#3b5ccb");  // --primary-color
      grad.addColorStop(0.4,  "#3055d1");  // --primary
      grad.addColorStop(0.75, "#8fd3f4");  // --color-5
      grad.addColorStop(1,    "#836df0");  // purple accent

      const barCount = Math.floor(bufferLength / 2); // lower half = more musical
      const barW     = canvas.width / barCount;
      const midY     = canvas.height / 2;

      for (let i = 0; i < barCount; i++) {
        const half = (dataArray[i] / 255) * midY;
        ctx.fillStyle = grad;
        // Mirrored bars grow from the centre outward
        ctx.beginPath();
        ctx.roundRect(
          i * barW + 1,
          midY - half,
          Math.max(barW - 2.5, 1),
          half * 2,
          2
        );
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, analyserRef]);

  /* ── Intersection observer — UNCHANGED ─────────────────────── */
  useEffect(() => {
    if (!isActive) return;

    const observer = new IntersectionObserver(
      ([entry]) => setActiveInView(entry.isIntersecting),
      { threshold: 0.4 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isActive]);

  // ── Display values ─────────────────────────────────────────────
  const displayTime     = isThisPlaying ? currentTime    : localCurrentTime;
  const displayDuration = localDuration || duration;
  const pct             = displayDuration ? (displayTime / displayDuration) * 100 : 0;

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div ref={cardRef} className={`voice-card ${isActive ? "active" : ""}`}>

      {/* Rotating conic shimmer — CSS shows it only when .active */}
      <div className="voice-card__conic" aria-hidden="true" />

      {/* Top gradient bar — slides in when .active */}
      <div className="voice-card__bar" aria-hidden="true" />

      {/* ── Top row: play + visualiser ── */}
      <div className="voice-top">

        <button
          className="voice-play"
          onClick={() => togglePlay(audioUrl)}
          aria-label={isActive ? "Pause voice note" : "Play voice note"}
        >
          {isLoading && currentUrl === audioUrl ? (
            <div className="loader-simple" />
          ) : isActive ? (
            <Pause size={16} />
          ) : (
            <Play size={16} />
          )}
        </button>

        <div className="voice-body">
          <p className="voice-label">Voice Note</p>
          <canvas ref={canvasRef} className="voice-canvas" />
        </div>
      </div>

      {/* ── Timer ── */}
      <div className="voice-timer">
        <span>{formatTime(displayTime)}</span>
        <span>{formatTime(displayDuration)}</span>
      </div>

      {/* ── Scrubber ── */}
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => {
          if (!activeAudioRef?.current) return;
          const dur     = displayDuration;
          const newTime = (Number(e.target.value) / 100) * dur;
          activeAudioRef.current.currentTime = newTime;
          setLocalCurrentTime(newTime);
          seek((newTime / dur) * 100);
        }}
        className="voice-range"
        style={{
          background: `linear-gradient(
            to right,
            var(--primary-color) ${pct}%,
            var(--hover-light)   ${pct}%
          )`,
        }}
      />
    </div>
  );
});

export default VoiceNoteCard;