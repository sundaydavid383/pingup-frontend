import { useRef, useState, useEffect, useCallback } from "react";

let currentlyPlayingAudio = null;
let currentlyPlayingSetter = null;

const AudioMessage = ({ msg, backgroundImage = null, barColor = "#3B82F6" }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioReady, setAudioReady] = useState(false);

  const formatTime = (sec) => {
    if (!sec || isNaN(sec) || sec === Infinity || sec <= 0) return "0:00";
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = duration && audioReady ? (currentTime / duration) * 100 : 0;

  // ── CORE FIX: resolve Infinity duration from blob/webm recordings ──────────
  // Browsers (especially Chrome) report duration=Infinity for MediaRecorder blobs
  // because no duration metadata is written into the stream. The fix is to seek
  // to a huge timestamp; the browser clamps it to the real end, then fires
  // durationchange with the correct finite value.
  const fixInfinityDuration = useCallback((audio) => {
    if (!audio) return;
    if (isFinite(audio.duration) && audio.duration > 0) {
      // Already known — nothing to do
      setDuration(audio.duration);
      setAudioReady(true);
      return;
    }
    // Seek way past the end; browser will clamp to true duration
    const onDurationChange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setAudioReady(true);
        // Restore position so it plays from the start
        audio.currentTime = 0;
        audio.removeEventListener("durationchange", onDurationChange);
      }
    };
    audio.addEventListener("durationchange", onDurationChange);
    audio.currentTime = 1e9; // very large number — browser clamps it
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  const handleLoaded = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
      setAudioReady(true);
    } else {
      // Duration is Infinity (common for blob URLs from MediaRecorder)
      fixInfinityDuration(audio);
    }
  }, [fixInfinityDuration]);

  const handleCanPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioReady) return;
    if (isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
      setAudioReady(true);
    } else {
      fixInfinityDuration(audio);
    }
  }, [audioReady, fixInfinityDuration]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);

    // Edge case: duration may become known mid-playback on some browsers
    if (!audioReady && isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
      setAudioReady(true);
    }
  }, [audioReady]);

  const handleWaiting = useCallback(() => setIsLoading(true), []);
  const handlePlaying = useCallback(() => {
    setIsLoading(false);
    setIsPlaying(true);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    currentlyPlayingAudio = null;
    currentlyPlayingSetter = null;
  }, []);

  const handleError = useCallback((e) => {
    console.error("Audio error:", e);
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [handleLoaded, handleCanPlay, handleTimeUpdate, handleWaiting, handlePlaying, handleEnded, handleError]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setIsLoading(false);
      currentlyPlayingAudio = null;
      currentlyPlayingSetter = null;
    } else {
      if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
        currentlyPlayingAudio.pause();
        currentlyPlayingAudio.currentTime = 0;
        if (currentlyPlayingSetter) currentlyPlayingSetter(false);
      }
      currentlyPlayingAudio = audio;
      currentlyPlayingSetter = setIsPlaying;
      setIsLoading(true);
      audio.play().catch((err) => {
        console.error("Play error:", err);
        setIsLoading(false);
        setIsPlaying(false);
      });
    }
  };

  const scrub = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration || !audioReady) return;
    const newPercent = parseFloat(e.target.value);
    const newTime = (newPercent / 100) * duration;
    if (!isNaN(newTime) && newTime >= 0 && newTime <= duration) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div
      className="fb-audio"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        padding: "8px",
        borderRadius: "12px",
        background: backgroundImage
          ? `url(${backgroundImage}) center/cover no-repeat`
          : "#F3F4F6",
      }}
    >
      <audio ref={audioRef} src={msg.media_url} preload="metadata" />

      <button
        onClick={togglePlay}
        disabled={isLoading}
        style={{
          position: "relative",
          zIndex: 2,
          backgroundColor: barColor,
          border: "none",
          borderRadius: "50%",
          color: "#fff",
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isLoading ? "not-allowed" : "pointer",
          flexShrink: 0,
        }}
      >
        {isLoading ? (
          <div
            style={{
              width: 16,
              height: 16,
              border: "2px solid rgba(255,255,255,0.4)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        ) : isPlaying ? "⏸" : "▶"}
      </button>

      <div className="flex-1 mx-2 relative" style={{ minWidth: 0 }}>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progressPercent}
          onChange={scrub}
          style={{
            width: "100%",
            WebkitAppearance: "none",
            appearance: "none",
            background: "transparent",
            height: 24,
            padding: "8px 0",
            position: "relative",
            zIndex: 2,
            cursor: "pointer",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            background: "#D1D5DB",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              borderRadius: 2,
              background: barColor,
            }}
          />
        </div>
      </div>

      <span className="text-xs text-gray-700" style={{ minWidth: 55, textAlign: "right", flexShrink: 0 }}>
        {formatTime(currentTime)}/{audioReady ? formatTime(duration) : "–:––"}
      </span>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${barColor};
          cursor: pointer;
          position: relative;
          z-index: 10;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${barColor};
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        input[type="range"]:focus { outline: none; }
      `}</style>
    </div>
  );
};

export default AudioMessage;
