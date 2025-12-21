import { useRef, useState, useEffect } from "react";

// Global references to currently playing audio & its setter
let currentlyPlayingAudio = null;
let currentlyPlayingSetter = null;

const AudioMessage = ({ msg, backgroundImage = null, barColor = "#3B82F6" }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
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

      setIsLoading(true);
      audio.play();
      setIsPlaying(true);
    }
  };

  const scrub = (e) => {
    const audio = audioRef.current;
    const newTime = (e.target.value / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
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
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      <input
        type="range"
        min="0"
        max="100"
        value={progressPercent}
        onChange={scrub}
        style={{
          flexGrow: 1,
          margin: "0 8px",
          height: 6,
          borderRadius: 3,
          background: `linear-gradient(to right, ${barColor} 0%, ${barColor} ${progressPercent}%, #D1D5DB ${progressPercent}%, #D1D5DB 100%)`,
          cursor: "pointer",
        }}
      />

      <span className="text-xs text-gray-700" style={{ minWidth: 35 }}>
        {formatTime(currentTime)}
      </span>

      <audio
        ref={audioRef}
        src={msg.media_url}
        type={msg.media_url.endsWith(".webm") ? "audio/webm" : "audio/mp3"}
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
