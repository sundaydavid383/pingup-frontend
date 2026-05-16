import React, { useRef, useState, useEffect, useCallback } from "react";
import "./videoplayer.css"; // make sure this file exists and is valid
import { BsPlayFill, BsPauseFill, BsFillVolumeMuteFill, BsFillVolumeUpFill } from "react-icons/bs";
import { MdFullscreen } from "react-icons/md";
import { videoManager, videoState } from "../../utils/videoManager";
import { useGlobalVideo } from "../../context/GlobalVideoContext";


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
  sectionId = "default"
}) {
  const { videoState: globalVideoState, updateVideoState } = useGlobalVideo();

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
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // hide controls after inactivity
  const hideTimerRef = useRef(null);
  const MIN_SHOW_TIME = 4000; // 4 seconds

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, MIN_SHOW_TIME);
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
      vid.play().catch(() => { });
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
      } catch (err) { }
    };

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    vid.addEventListener("loadedmetadata", onLoaded);
    vid.addEventListener("timeupdate", onTime);
    vid.addEventListener("play", onPlay);
    vid.addEventListener("pause", onPause);

    // NEW: call onEnded if provided
    const handleEnded = () => {
      const vid = videoRef.current
      if (!vid) return;

      vid.currentTime = 0
      vid.play().catch(() => { });

      syncToGlobal({
        playing: false,
        currentTime: 0
      });

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

          // 👀 ENTER viewport
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {

            // ❌ respect manual pause
            if (userPaused) return;

            // 🎯 claim ownership
            videoState.activeVideo = vid;

            // 🔔 notify others
            videoManager.dispatchEvent(
              new CustomEvent("video-play", { detail: vid })
            );

            // 🔑 autoplay rules
            vid.muted = !videoState.userHasUnmuted;
            if (videoState.userHasUnmuted) {
              vid.volume = volume || 0.8;
            }

            // ▶️ play only if not already playing
            if (vid.paused) {
              vid.play().catch(() => { });
            }
            syncToGlobal({ playing: true });

          }
          // 🚪 LEAVE viewport
          else {
            if (videoState.activeVideo === vid) {
              videoState.activeVideo = null;
            }

            vid.pause();
            syncToGlobal({ playing: false });
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();

  }, [autoPlayOnView, userPaused, volume]);


  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      const vid = videoRef.current;
      if (!vid) return;

      updateVideoState({
        currentTime: vid.currentTime,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [playing]);


  const syncToGlobal = (overrides = {}) => {
    const vid = videoRef.current;
    if (!vid) return;

    updateVideoState({
      src,
      poster,
      inlineRef: vid,
      currentTime: vid.currentTime,
      playing: !vid.paused,
      muted: vid.muted,
      volume: vid.volume,
      sectionId,
      ...overrides,
    });
  };

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
    const vid = videoRef.current;
    const el = containerRef.current;
    if (!el) return;
    const doc = document;
    
    if (!doc.fullscreenElement) {
      // Enter true fullscreen - use the video element for better experience
      const fullscreenTarget = vid || el;
      if (fullscreenTarget.requestFullscreen) {
        fullscreenTarget.requestFullscreen();
      } else if (fullscreenTarget.webkitRequestFullscreen) {
        fullscreenTarget.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }

  // Listen for fullscreen changes (ESC key or other)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!document.webkitFullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // play/pause click handler (accept optional event)
  function handlePlayPause() {
    const vid = videoRef.current;
    if (!vid) return;

    videoState.activeVideo = vid;

    let newUserPaused;
    if (vid.paused) {
      vid.play().catch(() => { });
      newUserPaused = false;
    } else {
      vid.pause();
      newUserPaused = true;
    }

    setUserPaused(newUserPaused);

    // 🔗 SYNC WITH GLOBAL CONTEXT
    syncToGlobal();

    videoManager.dispatchEvent(
      new CustomEvent("video-play", { detail: vid })
    );

    resetHideTimer();
  }



  useEffect(() => {
    console.log("USER PAUSED CHANGED:", userPaused);
  }, [userPaused]);

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
    resetHideTimer(); // ✅ ensures controls stay visible after tap
  }

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.load(); // starts buffering
  }, [src]);


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
  useEffect(() => {
  const vid = videoRef.current;
  const container = containerRef.current;
  if (!vid || !container) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      const currentVid = videoRef.current;
      if (!currentVid) return;
      if (!entry.isIntersecting && playing) {
        // 👋 inline disappeared → detach
        updateVideoState({
          isDetached: true,
          currentTime: currentVid.currentTime,
          playing: true,
        });

        currentVid.pause(); // stop inline
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(container);
  return () => observer.disconnect();
}, [playing]);


  return (
    <div
      ref={containerRef}
      className="vp-container"
      onClick={(e) => { e.stopPropagation(); resetHideTimer(); }}
      style={{
        maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        height: "auto",                    // ← changed from 80vh
        minHeight: "480px",
        width: "100%",
        maxWidth: "100%",
        "--vp-primary": "var(--primary)",
        "--vp-played-pct": `${playedPct}%`,
      }}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
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
          height: "auto",
          maxHeight: "82vh",           // ← safety cap
          objectFit: "contain",
          cursor: "pointer",
        }}
        onClick={handleCenterClick}
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
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
            {/* Volume control with vertical slider */}
            <div 
              className="vp-volume-container"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              {/* Mute/unmute button */}
              <button
                className="vp-btn vp-btn-large"
                onClick={handleMuteToggle}
                onMouseEnter={() => setShowVolumeSlider(true)}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <BsFillVolumeMuteFill className="vp-icon vp-icon-bigger" /> :
                  <BsFillVolumeUpFill className="vp-icon vp-icon-bigger" />}
              </button>

              {/* Vertical volume slider - only visible on hover/click */}
              <div className={`vp-volume-slider-container ${showVolumeSlider ? 'visible' : ''}`}>
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
                  className="vp-volume-range-vertical"
                  style={{ "--vol": `${volume * 100}%` }}
                  aria-label="Volume"
                />
              </div>
            </div>

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
