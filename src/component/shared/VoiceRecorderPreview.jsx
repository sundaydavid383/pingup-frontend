import React from "react";
import AudioMessage from "./AudioMessage";

const VoiceRecorderPreview = ({
  audioURL,
  recording,
  stopRecording,
  togglePause,
  isPausedRef,
  recordTime,
  setAudioURL,
  setRecording,
  setRecordTime,
  scrollToBottom,
  sendMessage,
}) => {
  if (!audioURL && !recording) return null;

  return (
    <div className="recording-wrapper">
      {audioURL ? (
        /* Audio Preview */
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 w-full">
          <div className="flex-1 min-w-0">
            <AudioMessage msg={{ media_url: audioURL }} />
          </div>

          {/* Delete */}
          <button
            onClick={() => {
              if (audioURL) URL.revokeObjectURL(audioURL);
              setAudioURL(null);
            }}
            className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition shrink-0"
            title="Delete recording"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>

          {/* Send */}
          <button
            onClick={() => {
              scrollToBottom();
              sendMessage();
            }}
            className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shrink-0"
            title="Send voice note"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      ) : (
        /* Recording UI */
        <div className="recording-container">
          {/* Stop */}
          <button
            onClick={stopRecording}
            className="recording-stop"
            title="Stop recording"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>

          {/* Center */}
          <div className="recording-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />

              <span className="text-xs text-red-500 font-medium">
                {isPausedRef.current ? "PAUSED" : "RECORDING"}
              </span>
            </div>

            <span className="recording-timer">
              {Math.floor(recordTime / 60)}:
              {String(recordTime % 60).padStart(2, "0")}
            </span>

            <div className="recording-waveform">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`wave-bar ${
                    isPausedRef.current ? "paused" : "active"
                  }`}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="recording-actions">
            {/* Cancel */}
            <button
              onClick={() => {
                stopRecording();
                setRecording(false);
                setRecordTime(0);
              }}
              className="recording-delete"
              title="Cancel recording"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="w-5 h-5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Pause */}
            <button
              onClick={togglePause}
              className="recording-pause"
              title={
                isPausedRef.current
                  ? "Resume recording"
                  : "Pause recording"
              }
            >
              {isPausedRef.current ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorderPreview;