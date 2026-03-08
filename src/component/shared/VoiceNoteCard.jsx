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
    currentTime, duration, formatTime,
    audioRef,
    isLoading,
  } = useAudioPlayer();

  // Internal audio ref for seeking
  const internalAudioRef = useRef(null);

  // Use external ref if provided, otherwise use internal ref
  const activeAudioRef = audioRef || internalAudioRef;

  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // Use the forwarded ref, fallback to internal if not provided
  const cardRef = useRef(null);



  useEffect(() => {
  if (!forwardedRef) return;

  if (typeof forwardedRef === "function") {
    forwardedRef(cardRef.current);
  } else {
    forwardedRef.current = cardRef.current;
  }
}, [forwardedRef]);


  const isActive = currentUrl === audioUrl && isPlaying;

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
  <span>{formatTime(currentTime)}</span>
  <span>{formatTime(duration)}</span>
</div>

      <input
        type="range"
        min={0}
        max={100}
        value={duration ? (currentTime / duration) * 100 : 0}
        onChange={(e) => {
          if (!activeAudioRef?.current) return;
          const newTime = (Number(e.target.value) / 100) * duration;
          activeAudioRef.current.currentTime = newTime;
          seek((newTime / duration) * 100);
        }}
        className="voice-range"
        style={{
          background: `linear-gradient(
      to right,
      var(--primary) ${(currentTime / duration) * 100}%,
      var(--hover-light) ${(currentTime / duration) * 100}%
          )`,
        }}
      />
    </div>
  );
});

export default VoiceNoteCard;
