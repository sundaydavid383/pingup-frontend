import React, { createContext, useState, useCallback, useRef } from "react";

/**
 * CallContext - Manages global WebRTC call state
 * 
 * Provides:
 * - currentCall: Active call information
 * - callHistory: Past calls
 * - callState: Current state (IDLE, RINGING, CONNECTING, CONNECTED, etc.)
 * - Methods to update call state
 */

export const CallContext = createContext();

const CALL_STATES = {
  IDLE: "IDLE",                    // No call
  INITIATING: "INITIATING",        // Initiating a call
  RINGING: "RINGING",              // Incoming call ringing / Outgoing call ringing
  CONNECTING: "CONNECTING",        // WebRTC negotiation
  CONNECTED: "CONNECTED",          // Active call with media flowing
  ENDED: "ENDED",                  // Call finished
  REJECTED: "REJECTED",            // Call was rejected
  CANCELLED: "CANCELLED",          // Call was cancelled
  MISSED: "MISSED",                // Incoming call not answered
  FAILED: "FAILED"                 // Connection failed
};

const CALL_TYPES = {
  AUDIO: "audio",
  VIDEO: "video"
};

export const CallProvider = ({ children }) => {
  // Current active call
  const [currentCall, setCurrentCall] = useState(null);

  // Call history for UI display
  const [callHistory, setCallHistory] = useState([]);

  // Error state
  const [callError, setCallError] = useState(null);

  // Media constraints (can be adjusted for mobile vs desktop)
  const [mediaConstraints, setMediaConstraints] = useState({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user"
    }
  });

  /**
   * Initialize a new call
   */
  const initiateCall = useCallback((receiverId, receiverName, callType = CALL_TYPES.VIDEO, receiverImage = null) => {
    console.log("📞 initiateCall called!");
    console.log("  receiverId:", receiverId);
    console.log("  receiverName:", receiverName);
    console.log("  callType:", callType);
    console.log("  receiverImage:", receiverImage);
    console.log("  currentCall:", currentCall);
    
    // Allow new call if currentCall is null or if the call has ended
    if (currentCall && currentCall.status !== CALL_STATES.ENDED && currentCall.status !== CALL_STATES.IDLE) {
      console.error("❌ Cannot initiate call - another call is active:", currentCall);
      return false;
    }

    console.log("✅ Creating new call...");
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log("  Generated callId:", callId);

    setCurrentCall({
      callId,
      type: callType,
      status: CALL_STATES.INITIATING,
      initiatorId: null,              // Will be set by component via user context
      initiatorName: null,
      receiverId,
      receiverName,
      receiverImage: receiverImage,
      direction: "outgoing",          // outgoing or incoming
      startTime: null,
      endTime: null,
      duration: 0,
      muted: false,
      videoDisabled: false,
      speakerOn: true,
      remoteStream: null,
      localStream: null
    });

    return callId;
  }, [currentCall]);

  /**
   * Receive an incoming call
   */
  const handleIncomingCall = useCallback((callData) => {
    if (currentCall?.status !== CALL_STATES.IDLE && currentCall) {
      console.warn("Incoming call ignored - another call is active");
      return false;
    }

    setCurrentCall({
      ...callData,
      status: CALL_STATES.RINGING,
      direction: "incoming",
      startTime: null,
      endTime: null,
      duration: 0,
      muted: false,
      videoDisabled: false,
      speakerOn: true,
      remoteStream: null,
      localStream: null
    });

    return true;
  }, [currentCall]);

  /**
   * Accept the current call
   */
  const acceptCall = useCallback(() => {
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, status: CALL_STATES.CONNECTING };
    });
  }, []);

  /**
   * Reject the current incoming call
   */
  const rejectCall = useCallback((reason = "declined") => {
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, status: CALL_STATES.REJECTED, rejectReason: reason };
    });
  }, []);

  /**
   * Call is now connected with media flowing
   */
  const setCallConnected = useCallback((localStream, remoteStream) => {
    setCurrentCall(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status: CALL_STATES.CONNECTED,
        startTime: new Date(),
        localStream,
        remoteStream
      };
    });
  }, []);

  /**
   * Update media state (mute/video toggle)
   */
  const toggleAudio = useCallback((muted) => {
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, muted };
    });
  }, []);

  const toggleVideo = useCallback((disabled) => {
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, videoDisabled: disabled };
    });
  }, []);

  const toggleSpeaker = useCallback((enabled) => {
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, speakerOn: enabled };
    });
  }, []);

  /**
   * End the current call
   */
  const endCall = useCallback(() => {
    setCurrentCall(prev => {
      if (!prev) return prev;

      const endTime = new Date();
      const duration = Math.floor((endTime - (prev.startTime || endTime)) / 1000);

      // Add to history
      setCallHistory(prevHistory => [
        {
          ...prev,
          status: CALL_STATES.ENDED,
          endTime,
          duration
        },
        ...prevHistory.slice(0, 49) // Keep last 50 calls
      ]);

      // Reset to null to allow new calls
      return null;
    });
  }, []);

  /**
   * Clear call state and go back to IDLE
   */
  const clearCall = useCallback(() => {
    setCurrentCall(null);
    setCallError(null);
  }, []);

  /**
   * Set error
   */
  const setError = useCallback((error) => {
    setCallError(error);
    setCurrentCall(prev => {
      if (!prev) return prev;
      return { ...prev, status: CALL_STATES.FAILED };
    });
  }, []);

  /**
   * Update call duration (should be called periodically during active call)
   */
  const updateDuration = useCallback(() => {
    setCurrentCall(prev => {
      if (!prev || !prev.startTime) return prev;
      return {
        ...prev,
        duration: Math.floor((new Date() - prev.startTime) / 1000)
      };
    });
  }, []);

  /**
   * Get call status string
   */
  const getCallStatus = useCallback(() => {
    if (!currentCall) return CALL_STATES.IDLE;
    return currentCall.status;
  }, [currentCall]);

  /**
   * Check if there's an active call
   */
  const hasActiveCall = useCallback(() => {
    return currentCall && (
      currentCall.status === CALL_STATES.CONNECTED ||
      currentCall.status === CALL_STATES.CONNECTING ||
      currentCall.status === CALL_STATES.INITIATING
    );
  }, [currentCall]);

  const value = {
    // State
    currentCall,
    callHistory,
    callError,
    mediaConstraints,
    CALL_STATES,
    CALL_TYPES,

    // Call actions
    initiateCall,
    handleIncomingCall,
    acceptCall,
    answerCall: acceptCall, // Alias for acceptCall
    rejectCall,
    setCallConnected,
    endCall,
    clearCall,
    setError,

    // Media controls
    toggleAudio,
    toggleVideo,
    toggleSpeaker,

    // Utility
    updateDuration,
    getCallStatus,
    hasActiveCall
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export { CALL_TYPES, CALL_STATES };

export default CallContext;
