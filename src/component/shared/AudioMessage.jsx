import { useRef, useState, useEffect, useCallback } from "react";

// Global references to currently playing audio & its setter
let currentlyPlayingAudio = null;
let currentlyPlayingSetter = null;

const AudioMessage = ({ msg, backgroundImage = null, barColor = "#3B82F6" }) => {
  const audioRef = useRef(null);
  const rangeInputRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioReady, setAudioReady] = useState(false);

  const formatTime = (sec) => {
    if (!sec || isNaN(sec) || sec === Infinity || sec === -Infinity) return "0:00";
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = duration && audioReady ? (currentTime / duration) * 100 : 0;

  // Handle loadedmetadata event - set duration
  const handleLoaded = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      const audioDuration = audio.duration;
      // Only set duration if it's a valid number
      if (!isNaN(audioDuration) && audioDuration !== Infinity && audioDuration > 0) {
        setDuration(audioDuration);
        setAudioReady(true);
      }
    }
  }, []);

  // Handle timeupdate event - update current time
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      const time = audio.currentTime;
      setCurrentTime(time);
      
      // Directly update the range input for smoother visual updates
      if (rangeInputRef.current && duration > 0) {
        const percent = (time / duration) * 100;
        rangeInputRef.current.value = percent;
      }
    }
  }, [duration]);

  const handleWaiting = useCallback(() => setIsLoading(true), []);
  const handlePlaying = useCallback(() => {
    setIsLoading(false);
    setIsPlaying(true);
  }, []);
  
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    // Reset range input
    if (rangeInputRef.current) {
      rangeInputRef.current.value = 0;
    }
  }, []);
  
  const handleError = useCallback((e) => {
    console.error('Audio error:', e);
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Use addEventListener for better compatibility
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [handleLoaded, handleTimeUpdate, handleWaiting, handlePlaying, handleEnded, handleError]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setIsLoading(false);
      if (currentlyPlayingAudio === audio) {
        currentlyPlayingAudio = null;
        currentlyPlayingSetter = null;
      }
    } else {
      // Stop currently playing audio if any
      if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
        currentlyPlayingAudio.pause();
        currentlyPlayingAudio.currentTime = 0;
        if (currentlyPlayingSetter) currentlyPlayingSetter(false);
      }

      currentlyPlayingAudio = audio;
      currentlyPlayingSetter = setIsPlaying;

      setIsLoading(true); // show loading immediately
      audio.play().catch((err) => {
        console.error('Play error:', err);
        setIsLoading(false); // stop spinner if play fails
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
          border: "2px solid #fff",
          borderTopColor: barColor,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
    ) : isPlaying ? "⏸" : "▶"}
  </button>

      {/* Range slider container */}
      <div className="flex-1 mx-2 relative">
        <input
          ref={rangeInputRef}
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progressPercent}
          onChange={scrub}
          className="w-full h-6 cursor-pointer"
          style={{
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
            height: 24,
            padding: '8px 0',
          }}
        />
        
        {/* Custom track visualization */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 8,
            right: 8,
            height: 4,
            borderRadius: 2,
            background: '#D1D5DB',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: 2,
              background: barColor,
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        <style>
          {`
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
            input[type="range"]:focus {
              outline: none;
            }
          `}
        </style>
      </div>

      {/* Time display: current / duration - WhatsApp style */}
      <span className="text-xs text-gray-700" style={{ minWidth: 55, textAlign: 'right' }}>
        {formatTime(currentTime)}/{audioReady ? formatTime(duration) : "0:00"}
      </span>

      <audio
        ref={audioRef}
        src={msg.media_url}
        preload="metadata"
        type={msg.media_url?.endsWith(".webm") ? "audio/webm" : "audio/mp3"}
      />

      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 24,
            height: 24,
            border: "3px solid #fff",
            borderTopColor: barColor,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AudioMessage;
