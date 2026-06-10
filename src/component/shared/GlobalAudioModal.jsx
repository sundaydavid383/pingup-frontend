import React, { useRef, useEffect, useState } from "react";
import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { Play, Pause, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/voicenotecard.css";

export default function GlobalVoiceModal() {
  const {
    currentUrl,
    isPlaying,
    togglePlay,
    progress,
    seek,
    audioRef,
    analyserRef,
    activeInView,
    setActiveInView,
    scrollToCurrentAudio,
    clearAudio,
    currentTime,
    duration,
    formatTime,
  } = useAudioPlayer();

  const location  = useLocation();
  const navigate  = useNavigate();
  const canvasRef = useRef(null);
  const [, forceUpdate] = useState(0);

  // Triggers re-render when audio changes so canvas reattaches
  useEffect(() => {
    forceUpdate((n) => n + 1);
  }, [currentUrl, isPlaying]);

  /* ── Drag state ─────────────────────────────────────────────── */
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const offsetRef   = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);

  /* ── Visibility — original logic, UNCHANGED ────────────────── */
  const shouldShow = !!currentUrl && (
    location.pathname !== "/" ||
    !activeInView
  );

  /* ── Visualizer ─────────────────────────────────────────────── */
  useEffect(() => {
    const canvas   = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser || !isPlaying) return;

    const ctx = canvas.getContext("2d");
    canvas.width  = canvas.offsetWidth  || 200;
    canvas.height = canvas.offsetHeight || 40;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray    = new Uint8Array(bufferLength);

    let rafId;

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Party gradient: primary-color → primary → color-5 → purple accent
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0,    "#3b5ccb");  // --primary-color
      grad.addColorStop(0.4,  "#3055d1");  // --primary
      grad.addColorStop(0.75, "#8fd3f4");  // --color-5
      grad.addColorStop(1,    "#836df0");  // purple accent

      const barCount = Math.floor(bufferLength / 2);
      const barW     = canvas.width / barCount;
      const midY     = canvas.height / 2;

      for (let i = 0; i < barCount; i++) {
        const half = (dataArray[i] / 255) * midY;
        ctx.fillStyle = grad;
        // Mirrored bars grow from centre
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

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, currentUrl, forceUpdate]);

  /* ── Drag logic — UNCHANGED ─────────────────────────────────── */
  const startDrag = (x, y) => {
    draggingRef.current = true;
    offsetRef.current   = { x: x - position.x, y: y - position.y };
  };

  const onDrag = (x, y) => {
    if (!draggingRef.current) return;
    setPosition({
      x: x - offsetRef.current.x,
      y: y - offsetRef.current.y,
    });
  };

  const stopDrag = () => {
    draggingRef.current = false;
  };

  // Mouse
  const onMouseDown = (e) => startDrag(e.clientX, e.clientY);
  const onMouseMove = (e) => onDrag(e.clientX, e.clientY);
  const onMouseUp   = stopDrag;

  // Touch
  const onTouchStart = (e) => {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  };

  const onTouchMove = (e) => {
    if (!draggingRef.current) return; // allow normal scroll when not dragging
    e.preventDefault();               // only prevent when dragging
    const t = e.touches[0];
    onDrag(t.clientX, t.clientY);
  };

  const onTouchEnd = stopDrag;

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend",  onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  onTouchEnd);
    };
  }, []);

  /* ── Render ─────────────────────────────────────────────────── */
  if (!shouldShow) return null;

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="vn-global"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      // onClick={() => {
      //   setTimeout(() => { scrollToCurrentAudio(); }, 100);
      //   navigate("/");
      // }}
      style={{
        position:    "fixed",
        left:        position.x,
        top:         position.y,
        touchAction: "pan-y",
      }}
    >
      {/* Rotating conic shimmer ring */}
      <div className="vn-global__conic" aria-hidden="true" />

      {/* Animated top glow bar */}
      <div className="vn-global__bar" aria-hidden="true" />

      {/* Close */}
      <button
        className="vn-global__close"
        onClick={() => clearAudio()}
        aria-label="Close player"
      >
        <X size={14} />
      </button>

      {/* ── Main row: play + label + canvas ── */}
      <div className="vn-global__inner">

        <button
          className="vn-global__play"
          onClick={() => togglePlay(currentUrl)}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <div className="vn-global__body">
          <span className="vn-global__label">Voice Note</span>
          <canvas ref={canvasRef} className="vn-global__canvas" />
        </div>
      </div>

      {/* ── Timer ── */}
      {formatTime && duration > 0 && (
        <div className="vn-global__timer">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}

      {/* ── Scrubber ── */}
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        className="vn-global__range"
        style={{
          background: `linear-gradient(
            to right,
            var(--primary-color) ${pct}%,
            var(--hover-light)   ${pct}%
          )`,
        }}
        onChange={(e) => {
          const newTime = (Number(e.target.value) / 100) * duration;
          audioRef.current.currentTime = newTime;
          seek((newTime / duration) * 100);
        }}
      />
    </div>
  );
}