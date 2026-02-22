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
    currentTime, duration, formatTime,
  } = useAudioPlayer();

  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [, forceUpdate] = useState(0);

useEffect(() => {
  forceUpdate((n) => n + 1); // triggers a re-render
}, [currentUrl, isPlaying]);

  /* ------------------ DRAG STATE ------------------ */
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);

  // Only show when audio is playing and user left feed

  const shouldShow = !!currentUrl  &&  (
    location.pathname !== "/" ||
    !activeInView
  );

/* ------------------ VISUALIZER ------------------ */
useEffect(() => {
  const canvas = canvasRef.current;
  const analyser = analyserRef.current;
  if (!canvas || !analyser || !isPlaying) return;

  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#1e40af");
  gradient.addColorStop(0.5, "#3b82f6");
  gradient.addColorStop(1, "#8fd3f4");

  let rafId;

  const draw = () => {
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / bufferLength;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 3;
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
    }

    rafId = requestAnimationFrame(draw);
  };

  draw();

  return () => cancelAnimationFrame(rafId);
}, [isPlaying, currentUrl, forceUpdate]);


  /* ------------------ DRAG LOGIC ------------------ */
  const startDrag = (x, y) => {
    draggingRef.current = true;
    offsetRef.current = {
      x: x - position.x,
      y: y - position.y,
    };
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
  const onMouseUp = stopDrag;

  // Touch
  const onTouchStart = (e) => {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  };

 const onTouchMove = (e) => {
  if (!draggingRef.current) return; // ← allow normal scroll

  e.preventDefault(); // only when dragging
  const t = e.touches[0];
  onDrag(t.clientX, t.clientY);
};


  const onTouchEnd = stopDrag;

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  /* ------------------ RENDER ------------------ */

  if (!shouldShow) return null;
  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    //   onClick={ ()=>{  setTimeout(() => {
    //   scrollToCurrentAudio();    // scroll to currently playing audio
    // }, 100); navigate("/");} }
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: 320,
        zIndex: 1000,
        cursor: "grab",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        backgroundColor: "var(--white-glass)",
        boxShadow: "0 0px 10px 0 rgba(31, 38, 135, 0.37)",
        touchAction: "pan-y"
        
      }}
      className=" rounded-xl shadow-xl p-3 flex items-center gap-2 ring-4 ring-inset ring-[rgb(255,255,255,.4)]"
    >
      {/* Close */}
      <button
        onClick={() => { clearAudio();}}
        className="absolute top-[-9px] right-[-3px] focus:outline-none border-none
        text-[var(--white)] bg-[red] rounded-full p-1 hover:bg-[var(--white)] hover:text-[red] transition hover:border-2 hover:border-[red]"
      >
        <X size={18} />
      </button>

      {/* Play / Pause */}
      <button onClick={() => togglePlay(currentUrl)} className="voice-play">
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      {/* Visualizer + Progress */}
<div className="flex-1">
  {/* Verbose / Voice Label */}
  <div className="voice-body mb-1">
    <p className="voice-label">Voice Note</p>
    <canvas ref={canvasRef} className="voice-canvas w-full h-10" />
  </div>

  {/* Timer */}
  {formatTime && duration > 0 && (
    <div className="voice-timer flex justify-between text-sm text-gray-400 mt-1">
      <span>{formatTime(currentTime)}</span>
      <span>{formatTime(duration)}</span>
    </div>
  )}

  {/* Slider */}
  <input
    type="range"
    min={0}
    max={100}
    value={duration ? (currentTime / duration) * 100 : 0}
    onChange={(e) => {
      const newTime = (Number(e.target.value) / 100) * duration;
      audioRef.current.currentTime = newTime;
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

    </div>
  );
}
