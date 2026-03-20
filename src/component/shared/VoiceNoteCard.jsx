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

  // Local state for independent timer per audio player
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);

  // Internal audio ref for local playback tracking
  const localAudioRef = useRef(null);

  // Use external ref if provided, otherwise use internal ref
  const activeAudioRef = audioRef || localAudioRef;

  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // Use the forwarded ref, fallback to internal if not provided
  const cardRef = useRef(null);

  // Determine if this card is currently active
  const isThisPlaying = currentUrl === audioUrl && isPlaying;
  const isActive = isThisPlaying;

  // Sync local state when global state changes
  useEffect(() => {
    if (isThisPlaying) {
      setLocalCurrentTime(currentTime);
      setLocalDuration(duration);
    }
  }, [isThisPlaying, currentTime, duration]);

  // Format time function (local)
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
  if (!forwardedRef) return;

  if (typeof forwardedRef === "function") {
    forwardedRef(cardRef.current);
  } else {
    forwardedRef.current = cardRef.current;
  }
}, [forwardedRef]);


  /* ------------------ VISUALIZER ------------------ */
  useEffect(() => {
    if (!isActive) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext("2d");

    canvas.width = 240;
    canvas.height = 40;

    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#1e40af");
    gradient.addColorStop(0.5, "#3b82f6");
    gradient.addColorStop(1, "#8fd3f4");

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 3;
        ctx.fillStyle = gradient;
        ctx.fillRect(
          i * barWidth,
          canvas.height - barHeight,
          barWidth - 2,
          barHeight
        );
      }
    };

    draw();

    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, analyserRef]);

  /* ------------------ INTERSECTION OBSERVER ------------------ */
  useEffect(() => {
    if (!isActive) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActiveInView(entry.isIntersecting);
      },
      { threshold: 0.4 }
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [isActive]);

  // Use local time when this card is not playing, global time when it is
  const displayTime = isThisPlaying ? currentTime : localCurrentTime;
  const displayDuration = localDuration || duration;

  /* ------------------ RENDER ------------------ */
  return (
    <div ref={cardRef} className={`voice-card ${isActive ? "active" : ""}`}>
      <div className="voice-top">
<button
  className="voice-play"
  onClick={() => togglePlay(audioUrl)}
>
  {isLoading && currentUrl === audioUrl ? (
    <div className="loader-simple"></div>
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
      <div className="voice-timer flex justify-between text-sm text-gray-400 mt-1">
  <span>{formatTime(displayTime)}</span>
  <span>{formatTime(displayDuration)}</span>
</div>

      <input
        type="range"
        min={0}
        max={100}
        value={displayDuration ? (displayTime / displayDuration) * 100 : 0}
        onChange={(e) => {
          if (!activeAudioRef?.current) return;
          const dur = displayDuration;
          const newTime = (Number(e.target.value) / 100) * dur;
          activeAudioRef.current.currentTime = newTime;
          setLocalCurrentTime(newTime);
          seek((newTime / dur) * 100);
        }}
        className="voice-range"
        style={{
          background: `linear-gradient(
      to right,
      var(--primary) ${displayDuration ? (displayTime / displayDuration) * 100 : 0}%,
      var(--hover-light) ${displayDuration ? (displayTime / displayDuration) * 100 : 0}%
          )`,
        }}
      />
    </div>
  );
});

export default VoiceNoteCard;
