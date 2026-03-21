import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle
} from "lucide-react";
import { CallContext } from "../../context/CallContext";

/**
 * AudioCallUI
 * 
 * Display for audio-only calls with:
 * - Caller profile
 * - Call timer
 * - Mute/speaker controls
 * - End call button
 */

const AudioCallUI = ({
  localStream,
  remoteStream,
  onEndCall,
  onMuteToggle,
  onSpeakerToggle,
  isMuted = false,
  isSpeakerOn = true
}) => {
  const callContext = useContext(CallContext);
  const remoteAudioRef = useRef(null);
  const localAudioRef = useRef(null);
  const [callTimer, setCallTimer] = useState("00:00");
  const timerIntervalRef = useRef(null);

  const call = callContext && callContext.currentCall ? callContext.currentCall : null;
  const callStatusMessage = callContext?.callStatusMessage;

  // Debug: Log audio call state
  useEffect(() => {
    console.log("📞 AudioCallUI: Component rendered", {
      callId: call?.callId,
      status: call?.status,
      hasLocalStream: !!localStream,
      hasRemoteStream: !!remoteStream,
      isMuted,
      isSpeakerOn
    });
  }, [call, localStream, remoteStream, isMuted, isSpeakerOn]);

  // Setup audio elements
  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
      console.log("📞 AudioCallUI: Local audio stream attached");
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      console.log("📞 AudioCallUI: Remote audio stream attached");
    }
  }, [remoteStream]);

  // Update call timer
  useEffect(() => {
    if (call && call.status === (callContext && callContext.CALL_STATES && callContext.CALL_STATES.CONNECTED)) {
      console.log("📞 AudioCallUI: Call connected, starting timer");
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

  if (!call) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
      {/* Hidden audio elements */}
      <audio ref={remoteAudioRef} autoPlay />
      <audio ref={localAudioRef} muted autoPlay />

      {/* Call Container */}
      <div className="flex flex-col items-center gap-8 w-full max-w-md px-4">
        {/* Profile Section */}
        <div className="flex flex-col items-center gap-4">
          {/* Profile Avatar */}
          <div className="relative">
            <img
              src={call.receiverImage || "https://via.placeholder.com/100"}
              alt={call.receiverName}
              className="w-32 h-32 rounded-full object-cover ring-4 ring-blue-500 shadow-lg"
            />

            {/* Online Status Indicator */}
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
          </div>

          {/* Caller Name */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">{call.receiverName}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {callStatusMessage || (call?.status === (callContext?.CALL_STATES?.CONNECTED) 
                ? '✅ Connected' 
                : call?.status === (callContext?.CALL_STATES?.RINGING)
                  ? '🔔 Ringing...'
                  : call?.error 
                    ? `❌ Call failed — ${call.error}`
                    : remoteStream ? '✅ Connected' : '⏳ Connecting...')}
            </p>
          </div>
        </div>

        {/* Call Timer */}
        <div className="bg-gray-800/50 backdrop-blur px-6 py-3 rounded-full">
          <span className="text-white font-mono font-bold text-4xl">{callTimer}</span>
        </div>

        {/* Connection Status */}
        {!remoteStream && (
          <div className="text-center">
            <div className="inline-block mb-3">
              <div className="flex gap-1">
                <div className="w-2 h-8 bg-blue-500 rounded animate-pulse" style={{ animationDelay: "0s" }}></div>
                <div className="w-2 h-8 bg-blue-500 rounded animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-8 bg-blue-500 rounded animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
            <p className="text-gray-400">Establishing connection...</p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 w-full">
          {/* Message Button */}
          <button
            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
            title="Send Message"
          >
            <MessageCircle size={24} className="text-white" />
          </button>

          {/* Mute Button */}
          <button
            onClick={() => {
              console.log("📞 AudioCallUI: Mute toggle clicked", { currentlyMuted: isMuted });
              onMuteToggle && onMuteToggle(!isMuted);
            }}
            className={`p-4 rounded-full transition-all ${
              isMuted
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

          {/* Speaker Button */}
          <button
            onClick={() => {
              console.log("📞 AudioCallUI: Speaker toggle clicked", { currentlySpeakerOn: isSpeakerOn });
              onSpeakerToggle && onSpeakerToggle(!isSpeakerOn);
            }}
            className={`p-4 rounded-full transition-all ${
              isSpeakerOn
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-red-600 hover:bg-red-700"
            }`}
            title={isSpeakerOn ? "Turn off speaker" : "Turn on speaker"}
          >
            {isSpeakerOn ? (
              <Volume2 size={24} className="text-white" />
            ) : (
              <VolumeX size={24} className="text-white" />
            )}
          </button>

          {/* End Call Button - PROMINENT */}
          <button
            onClick={() => {
              console.log("📞 AudioCallUI: End call button clicked");
              onEndCall();
            }}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
            title="End Call"
          >
            <PhoneOff size={24} className="text-white" />
          </button>
        </div>

        {/* Call Duration Info */}
        <div className="text-center text-gray-500 text-sm">
          <p>Audio Call</p>
        </div>
      </div>
    </div>
  );
};

export default AudioCallUI;
