import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Maximize2,
  Settings
} from "lucide-react";
import { CallContext } from "../../context/CallContext";

/**
 * VideoCallUI
 * 
 * Displays video call interface with:
 * - Local video stream (self)
 * - Remote video stream (other user)
 * - Call controls (mute, video toggle, speaker, end call)
 * - Call timer
 * - Picture-in-picture mode
 */

const VideoCallUI = ({
  localStream,
  remoteStream,
  onEndCall,
  onMuteToggle,
  onVideoToggle,
  onSpeakerToggle,
  isMuted = false,
  isVideoDisabled = false,
  isSpeakerOn = true
}) => {
  const callContext = useContext(CallContext);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callTimer, setCallTimer] = useState("00:00");
  const [pipMode, setPipMode] = useState(false);
  const timerIntervalRef = useRef(null);

  const call = callContext && callContext.currentCall ? callContext.currentCall : null;
  const callStatusMessage = callContext?.callStatusMessage;

  // Debug: Log video call state
  useEffect(() => {
    console.log("📞 VideoCallUI: Component rendered", {
      callId: call?.callId,
      status: call?.status,
      hasLocalStream: !!localStream,
      hasRemoteStream: !!remoteStream,
      isMuted,
      isVideoDisabled,
      isSpeakerOn
    });
  }, [call, localStream, remoteStream, isMuted, isVideoDisabled, isSpeakerOn]);

  // Update local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log("📞 VideoCallUI: Local video stream attached");
    }
  }, [localStream]);

  // Update remote video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log("📞 VideoCallUI: Remote video stream attached");
    }
  }, [remoteStream]);

  // Update call timer
  useEffect(() => {
    if (call && call.status === (callContext && callContext.CALL_STATES && callContext.CALL_STATES.CONNECTED)) {
      console.log("📞 VideoCallUI: Call connected, starting timer");
      timerIntervalRef.current = setInterval(() => {
        callContext.updateDuration();
        const duration = call.duration || 0;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;

        if (hours > 0) {
          setCallTimer(
            `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
              .toString()
              .padStart(2, "0")}`
          );
        } else {
          setCallTimer(
            `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
          );
        }
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [call, callContext]);

  const handlePiP = async () => {
    try {
      console.log("📞 VideoCallUI: Picture-in-Picture toggle");
      if (remoteVideoRef.current) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setPipMode(false);
        } else {
          await remoteVideoRef.current.requestPictureInPicture();
          setPipMode(true);
        }
      }
    } catch (error) {
      console.error("📞 VideoCallUI: PiP error:", error);
    }
  };

  if (!call || !localStream) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col">
      {/* Remote Video - Full screen */}
      <div className="flex-1 relative bg-gray-900">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center">
                <img
                  src={call.receiverImage || "https://via.placeholder.com/100"}
                  alt={call.receiverName}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <p className="text-white text-lg font-semibold">{call.receiverName}</p>
              <p className="text-gray-400 text-sm mt-2">
                {callStatusMessage || (call.status === (callContext && callContext.CALL_STATES && callContext.CALL_STATES.CONNECTED) 
                  ? '✅ Connected' 
                  : call.status === (callContext && callContext.CALL_STATES && callContext.CALL_STATES.RINGING)
                    ? '🔔 Ringing...'
                    : call.error 
                      ? `❌ Call failed — ${call.error}`
                      : '⏳ Connecting...')}
              </p>
            </div>
          </div>
        )}

        {/* Local Video - Picture in Picture */}
        <div className="absolute bottom-4 right-4 w-32 h-40 rounded-lg overflow-hidden shadow-xl border-2 border-white bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        </div>

        {/* Call Timer */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur px-4 py-2 rounded-full">
          <span className="text-white font-mono font-bold text-lg">{callTimer}</span>
        </div>

        {/* Connection Status */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="inline-block">
                <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-white border-r-white animate-spin"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-black/80 backdrop-blur border-t border-gray-700 px-4 py-4 flex items-center justify-center gap-4">
        {/* Mute Audio */}
        <button
          onClick={() => {
            console.log("📞 VideoCallUI: Mute toggle clicked", { currentlyMuted: isMuted });
            onMuteToggle && onMuteToggle(!isMuted);
          }}
          className={`p-3 rounded-full transition-all ${isMuted
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-700 hover:bg-gray-600"
            }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <MicOff size={24} className="text-white" />
          ) : (
            <Mic size={24} className="text-white" />
          )}
        </button>

        {/* Toggle Video */}
        <button
          onClick={() => {
            console.log("📞 VideoCallUI: Video toggle clicked", { currentlyDisabled: isVideoDisabled });
            onVideoToggle && onVideoToggle(!isVideoDisabled);
          }}
          className={`p-3 rounded-full transition-all ${isVideoDisabled
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-700 hover:bg-gray-600"
            }`}
          title={isVideoDisabled ? "Start Video" : "Stop Video"}
        >
          {isVideoDisabled ? (
            <VideoOff size={24} className="text-white" />
          ) : (
            <Video size={24} className="text-white" />
          )}
        </button>

        {/* Speaker */}
        <button
          onClick={() => {
            console.log("📞 VideoCallUI: Speaker toggle clicked", { currentlySpeakerOn: isSpeakerOn });
            onSpeakerToggle && onSpeakerToggle(!isSpeakerOn);
          }}
          className={`p-3 rounded-full transition-all ${isSpeakerOn
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
            }`}
          title={isSpeakerOn ? "Mute Speaker" : "Unmute Speaker"}
        >
          {isSpeakerOn ? (
            <Volume2 size={24} className="text-white" />
          ) : (
            <VolumeX size={24} className="text-white" />
          )}
        </button>

        {/* Picture in Picture */}
        <button
          onClick={handlePiP}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
          title="Picture in Picture"
        >
          <Maximize2 size={24} className="text-white" />
        </button>

        {/* Settings/More Options */}
        <button
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
          title="More options"
        >
          <Settings size={24} className="text-white" />
        </button>

        {/* End Call - PROMINENT */}
        <button
          onClick={() => {
            console.log("📞 VideoCallUI: End call button clicked");
            onEndCall();
          }}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all ml-4 shadow-lg hover:shadow-xl"
          title="End Call"
        >
          <PhoneOff size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default VideoCallUI;
