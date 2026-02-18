import React from "react";

const RecordingIndicator = ({ recordTime, maxRecordTime, onStop }) => {
    if (recordTime === 0 && !onStop) return null;

    const progressPercentage = (recordTime / maxRecordTime) * 100;

    return (
        <div className="recording-container" role="status" aria-label="Recording audio">
            <div className="recording-controls">
                {/* Range-style progress bar */}
                <div className="recording-progress">
                    <input
                        type="range"
                        min={0}
                        max={maxRecordTime}
                        value={recordTime}
                        readOnly
                        aria-label="Recording progress"
                        style={{
                            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${progressPercentage}%, #d1d5db ${progressPercentage}%, #d1d5db 100%)`,
                        }}
                    />
                </div>

                {/* Time indicator */}
                <span className="recording-time" aria-live="polite">
                    {recordTime}s / {maxRecordTime}s
                </span>

                {/* Stop button */}
                <button
                    onClick={onStop}
                    className="send-button"
                    style={{ width: "44px", height: "44px" }}
                    title="Stop recording"
                    aria-label="Stop audio recording"
                    type="button"
                >
                    ⏹️
                </button>
            </div>
        </div>
    );
};

export default RecordingIndicator;
