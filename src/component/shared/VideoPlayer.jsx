import React, { useRef, useState, useEffect, useCallback } from "react";
import "./videoplayer.css"; // make sure this file exists and is valid
import { BsPlayFill, BsPauseFill, BsFillVolumeMuteFill, BsFillVolumeUpFill } from "react-icons/bs";
import { MdFullscreen } from "react-icons/md";
import {videoManager, videoState} from "../../utils/videoManager";

/**
 * Props:
 * - src: video url (required)
 * - poster: optional poster image
 * - maxHeight: optional maxHeight in px or CSS unit (string or number)
 * - primaryColor: CSS color for highlights (optional, defaults to #1f6feb)
 * - autoPlayOnView: boolean (default true) -> play when 50% visible unless user paused manually
 */

export default function VideoPlayer({
  src,
  poster,
  maxHeight = "480px",
  autoPlayOnView = true,
  unmuteOnView = false, 
  onEnded,
  sectionId="default"
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const controlsRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  // hide controls after inactivity
  const hideTimerRef = useRef(null);
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  }, []);



const handleMuteToggle = () => {
  const vid = videoRef.current;
  if (!vid) return;

  const next = !muted;
  setMuted(next);
  vid.muted = next;

  if (!next) {
    // 🔓 USER GESTURE (once is enough)
    videoState.userHasUnmuted = true;
    videoState.activeVideo = vid;

    videoManager.dispatchEvent(
      new CustomEvent("video-play", { detail: vid })
    );

    vid.volume = volume || 0.8;
    vid.play().catch(() => {});
  }
};


useEffect(() => {
  const vid = videoRef.current;
  if (!vid) return;

  const onGlobalPlay = (e) => {
    if (e.detail !== vid) {
      vid.pause();
      vid.muted = false;     // 🔥 FORCE MUTE
      setMuted(false);
    }
  };

  videoManager.addEventListener("video-play", onGlobalPlay);
  return () => videoManager.removeEventListener("video-play", onGlobalPlay);
}, []);


  const fmt = (s) => {
    if (s == null || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${sec}`;
  };

useEffect(() => {
  const vid = videoRef.current;
  if (!vid) return;

  const onLoaded = () => {
    setDuration(vid.duration || 0);
    setCurrent(vid.currentTime || 0);
  };

  const onTime = () => {
    setCurrent(vid.currentTime || 0);
    try {
      const b = vid.buffered;
      if (b && b.length) setBuffered(b.end(b.length - 1));
    } catch (err) {}
  };

  const onPlay = () => setPlaying(true);
  const onPause = () => setPlaying(false);

  vid.addEventListener("loadedmetadata", onLoaded);
  vid.addEventListener("timeupdate", onTime);
  vid.addEventListener("play", onPlay);
  vid.addEventListener("pause", onPause);

  // NEW: call onEnded if provided
  const handleEnded = () => {
    if (typeof onEnded === "function") onEnded();
  };
  vid.addEventListener("ended", handleEnded);

  return () => {
    vid.removeEventListener("loadedmetadata", onLoaded);
    vid.removeEventListener("timeupdate", onTime);
    vid.removeEventListener("play", onPlay);
    vid.removeEventListener("pause", onPause);
    vid.removeEventListener("ended", handleEnded);
  };
}, []);

useEffect(() => {
  const vid = videoRef.current;
  if (!vid) return;

  const handleCanPlay = () => setLoading(false);
  const handleWaiting = () => setLoading(true);
  const handlePlaying = () => setLoading(false);

  vid.addEventListener("canplay", handleCanPlay);
  vid.addEventListener("waiting", handleWaiting);
  vid.addEventListener("playing", handlePlaying);

  return () => {
    vid.removeEventListener("canplay", handleCanPlay);
    vid.removeEventListener("waiting", handleWaiting);
    vid.removeEventListener("playing", handlePlaying);
  };
}, []);

  useEffect(() => {
    if (!autoPlayOnView) return;
    const el = containerRef.current;
    const vid = videoRef.current;
    if (!el || !vid) return;

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const vid = videoRef.current;
      if (!vid) return;

      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        // 🎯 claim ownership
        videoState.activeVideo = vid;

        // 🔔 notify others
        videoManager.dispatchEvent(
          new CustomEvent("video-play", { detail: vid })
        );

        // 🔑 autoplay logic
        // If user never unmuted, browser policy may require muted first
        vid.muted = !videoState.userHasUnmuted;
        if (videoState.userHasUnmuted) {
          vid.volume = volume || 0.8;
        }

        // always play when visible
        vid.play().catch(() => {});
      } else {
        // leaving viewport: pause video
        if (videoState.activeVideo === vid) {
          videoState.activeVideo = null;
        }

        vid.pause();
      }
    });
  },
  { threshold: 0.5 }
);


    observer.observe(el);
    return () => observer.disconnect();
  }, [autoPlayOnView, userPaused]);

  // keyboard shortcutsF
  useEffect(() => {
    const onKey = (e) => {
      const vid = videoRef.current;
      if (!vid) return;

          // Only respond if container is focused or hovered
    const container = containerRef.current;
    if (!container || !container.matches(':hover')) return; 
    
      if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

      if (e.key === " " || e.code === "Space" || e.key === "K") {
        e.preventDefault();
        if (vid.paused) {
          vid.play();
          setUserPaused(false);
        } else {
          vid.pause();
          setUserPaused(true);
        }
      } else if (e.key === "f") {
        toggleFullscreen();
      } else if (e.key === "ArrowLeft" || e.key === "L" || e.key === "l") {
        vid.currentTime = Math.min(vid.currentTime + 5, vid.duration || Infinity);
      } else if (e.key === "ArrowRight" || e.key === "J" || e.key === "j") {
        vid.currentTime = Math.max(vid.currentTime - 5, 0);
      } else if (e.key === "I" || e.key === "i") {
        const vol = Math.min(1, (vid.volume || 0) + 0.1);
        vid.volume = vol;
        setVolume(vol);
        setMuted(vol === 0);
      } else if (e.key === "M" || e.key === "m") {
        const vol = Math.max(0, (vid.volume || 0) - 0.1);
        vid.volume = vol;
        setVolume(vol);
        setMuted(vol === 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // intentionally no deps so listener added once
  }, []);

  // update volume when slider changes
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.volume = volume;
    vid.muted = muted;
  }, [volume, muted]);

  // fullscreen helpers (accept optional event)
  function toggleFullscreen(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const doc = document;
    if (!doc.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      setIsFullscreen(true);
    } else {
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen && doc.webkitExitFullscreen();
      setIsFullscreen(false);
    }
  }

  // play/pause click handler (accept optional event)
  function handlePlayPause(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
        videoManager.dispatchEvent(new CustomEvent("video-play", { detail: vid }));
      vid.play().catch(() => {});
      setUserPaused(false);
    } else {
      vid.pause();
      setUserPaused(true);
    }
    resetHideTimer();
  }

  // seeking
  function handleSeek(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    const newTime = parseFloat(e.target.value);
    vid.currentTime = newTime;
    setCurrent(newTime);
    resetHideTimer();
  }

  function handleMouseMove() {
    resetHideTimer();
  }

  function handleCenterClick(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    handlePlayPause();
  }

  // IMPORTANT: stop propagation on the container so clicks inside player don't bubble to parent wrappers
 // compute played percent (place this in the component body, right before return)
const playedPct = duration ? (current / duration) * 100 : 0;


useEffect(() => {
  const vid = videoRef.current;
  if (!vid) return;

  // Pause this video if another video starts
  const onOtherVideoPlay = (e) => {
    if (e.detail !== vid) {
      vid.pause();
    }
  };

  videoManager.addEventListener("video-play", onOtherVideoPlay);

  return () => {
    videoManager.removeEventListener("video-play", onOtherVideoPlay);
  };
}, []);

return (
<div
  ref={containerRef}
  className="vp-container"
  onClick={(e) => e.stopPropagation()}
  style={{
    maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
    height: "80vh",   // ✅ increase from 50vh
    width: "100%",
    "--vp-primary": "var(--primary)",
    "--vp-played-pct": `${playedPct}%`,
  }}
  onMouseMove={handleMouseMove}
  onMouseEnter={() => setShowControls(true)}
  onMouseLeave={() => setShowControls(false)}
>
  <video
    ref={videoRef}
    src={src}
    poster={poster}
    className="vp-video"
    playsInline
    preload="metadata"
    muted={muted}
    style={{
      width: "100%",
      height: "100%",     // ✅ fill container height
      objectFit: "contain", // ✅ maintain aspect ratio
    }}
  />


    {loading && (
  <div className="vp-loading-overlay">
    <div className="vp-spinner"></div>
  </div>
)}

    {/* Center big play button */}
    <button
      className={`vp-center-btn ${playing ? "hidden" : ""}`}
      onClick={handleCenterClick}
      aria-label={playing ? "Pause" : "Play"}
    >
      <BsPlayFill className="vp-center-icon vp-icon-giant" />
    </button>

    {/* Controls */}
    <div
      ref={controlsRef}
      className={`vp-controls ${showControls || !playing ? "visible" : "hidden"}`}
      onMouseMove={(e) => e.stopPropagation()}
    >

            <div className="vp-center">
        <div className="vp-progress-wrapper">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="0.1"
            value={current}
            onChange={handleSeek}
            className="vp-range"
            aria-label="Seek"
            style={{
              background: `linear-gradient(to right, var(--vp-primary) 0%, var(--vp-primary) ${playedPct}%, rgba(255,255,255,0.35) ${playedPct}%, rgba(255,255,255,0.12) 100%)`,
            }}
          />
          <div
            className="vp-buffer-bar"
            style={{
              width: duration ? `${(buffered / duration) * 100}%` : "0%",
            }}
            aria-hidden
          />
        </div>
      </div>
 

      <div className="vp-bottom">     
        <div className="vp-left">
        {/* Left play/pause button */}
        <button className="vp-btn vp-btn-large" onClick={handlePlayPause} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <BsPauseFill className="vp-icon vp-icon-bigger" /> : <BsPlayFill className="vp-icon vp-icon-bigger" />}
        </button>

        <div className="vp-time">
          {fmt(current)} / {fmt(duration)}
        </div>
      </div>
      <div className="vp-right">
        {/* Mute/unmute button */}
        <button
          className="vp-btn vp-btn-large"
          onClick={handleMuteToggle}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <BsFillVolumeMuteFill className="vp-icon vp-icon-bigger" /> : 
          <BsFillVolumeUpFill className="vp-icon vp-icon-bigger" />}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setVolume(val);
            setMuted(val === 0);
          }}
          className="vp-volume"
          aria-label="Volume"
        />

        {/* Fullscreen button */}
        <button className="vp-btn vp-btn-large" onClick={toggleFullscreen} aria-label="Fullscreen">
          <MdFullscreen className="vp-icon vp-icon-bigger" />
        </button>
      </div>
      </div>



      
    </div>
  </div>
);


}
