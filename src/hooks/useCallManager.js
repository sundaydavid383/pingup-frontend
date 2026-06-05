import { useEffect, useCallback, useRef, useContext } from "react";
import { CallContext } from "../context/CallContext";

const useCallManager = ({ socket, user, webrtcManager, onCallStateChange }) => {
  const callContext = useContext(CallContext);
  const ringtoneSoundRef = useRef(new Audio("/audio/ringtone.mp3"));
  const callRejectionTimeoutRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const callContextRef = useRef(callContext);
  const webrtcManagerRef = useRef(webrtcManager);
  const rejectCallRef = useRef(null);
  const endCallRef = useRef(null);

  // ✅ FIX 1: Ref-based lock to prevent duplicate callAcceptedAck handling
  const callAcceptedHandledRef = useRef(false);

  useEffect(() => { callContextRef.current = callContext; }, [callContext]);
  useEffect(() => { webrtcManagerRef.current = webrtcManager; }, [webrtcManager]);

  const initiateCall = useCallback(
    (receiverId, receiverName, callType = "video", receiverImage = null) => {
      try {
        if (!socket || !user || !callContext) {
          console.warn("📞 useCallManager: Call system not ready yet - socket/user/context missing");
          return;
        }

        console.log("📞 useCallManager: initiateCall() called");
        console.log("  -> receiverId:", receiverId);
        console.log("  -> receiverName:", receiverName);
        console.log("  -> callType:", callType);
        console.log("  -> receiverImage:", receiverImage);

        // ✅ FIX 1: Reset the lock when starting a new call
        callAcceptedHandledRef.current = false;

        const callId = callContext.initiateCall(
          receiverId,
          receiverName,
          callType,
          receiverImage
        );

        if (!callId) {
          console.error("📞 useCallManager: Cannot initiate call - another call is active");
          return;
        }

        console.log("📞 useCallManager: Call created with ID:", callId);

        console.log("📞 useCallManager: Emitting callInitiated event to server...");
        socket.emit("callInitiated", {
          callId,
          initiatorId: user._id,
          receiverId,
          callType,
          timestamp: new Date().toISOString()
        });
        console.log("📞 useCallManager: callInitiated event sent");

        console.log("📞 useCallManager: Setting 30s timeout for call rejection/timeout...");
        callRejectionTimeoutRef.current = setTimeout(() => {
          console.log("📞 useCallManager: Call timeout - no response from user");
          callContext.setError("Call not answered - please try again");
          callContext.setCallStatusMessage("⏱️ No response — call timed out");
        }, 30000);

        console.log("📞 useCallManager: Call initiation complete - waiting for response");

        if (onCallStateChange) {
          onCallStateChange('initiating');
        }
      } catch (error) {
        console.error("📞 useCallManager: Error initiating call:", error);
        callContext.setError(error.message);
      }
    },
    [socket, user, callContext, onCallStateChange]
  );

  const acceptCall = useCallback(async () => {
    try {
      if (!socket || !user || !callContext) {
        console.warn("📞 useCallManager: Call system not ready yet");
        return;
      }
      if (!callContext.currentCall) {
        console.error("📞 useCallManager: No incoming call to accept");
        return;
      }

      console.log("📞 useCallManager: acceptCall() called");
      console.log("  -> callId:", callContext.currentCall.callId);
      console.log("  -> callType:", callContext.currentCall.type);
      console.log("  -> initiatorName:", callContext.currentCall.initiatorName);

      console.log("📞 useCallManager: Stopping ringtone...");
      ringtoneSoundRef.current.pause();
      clearTimeout(callRejectionTimeoutRef.current);

      console.log("📞 useCallManager: Accepting call in context...");
      callContext.acceptCall();

      console.log("📞 useCallManager: Emitting callAccepted event to server...");
      socket.emit("callAccepted", {
        callId: callContext.currentCall.callId,
        acceptorId: user._id,
        timestamp: new Date().toISOString()
      });
      console.log("📞 useCallManager: callAccepted event sent");

      if (webrtcManager) {
        console.log("📞 useCallManager: Initializing WebRTC...");
        try {
          await webrtcManager.initialize();
          console.log("📞 useCallManager: WebRTC initialized successfully");
        } catch (error) {
          console.error("📞 useCallManager: WebRTC initialization failed:", error);
          callContext.setError("Failed to initialize media - please check camera/microphone permissions");
        }
      } else {
        console.warn("📞 useCallManager: webrtcManager not available");
      }

      console.log("📞 useCallManager: Call accepted successfully");

      if (onCallStateChange) {
        onCallStateChange('accepted');
      }
    } catch (error) {
      console.error("📞 useCallManager: Error accepting call:", error);
      callContext.setError(error.message);
    }
  }, [callContext, socket, user, webrtcManager, onCallStateChange]);

  const rejectCall = useCallback(
    (reason = "declined") => {
      if (!socket || !user || !callContext) {
        console.warn("📞 useCallManager: Call system not ready yet");
        return;
      }
      try {
        if (!callContext.currentCall) {
          console.error("📞 useCallManager: No incoming call to reject");
          return;
        }

        console.log("📞 useCallManager: rejectCall() called");
        console.log("  -> reason:", reason);
        console.log("  -> callId:", callContext.currentCall.callId);

        // ✅ FIX 1: Reset lock on reject
        callAcceptedHandledRef.current = false;

        console.log("📞 useCallManager: Stopping ringtone...");
        ringtoneSoundRef.current.pause();

        console.log("📞 useCallManager: Emitting callRejected event to server...");
        socket.emit("callRejected", {
          callId: callContext.currentCall.callId,
          rejecterId: user._id,
          reason,
          timestamp: new Date().toISOString()
        });

        console.log("📞 useCallManager: Rejecting call in context...");
        callContext.rejectCall(reason);

        console.log("📞 useCallManager: Scheduling call clear in 2 seconds...");
        setTimeout(() => {
          callContext.clearCall();
        }, 2000);

        console.log("📞 useCallManager: Call rejected -", reason);

        if (onCallStateChange) {
          onCallStateChange('rejected');
        }
      } catch (error) {
        console.error("📞 useCallManager: Error rejecting call:", error);
      }
    },
    [callContext, socket, user, onCallStateChange]
  );

  const endCall = useCallback(() => {
    try {
      if (!socket || !user || !callContext) {
        console.warn("📞 useCallManager: Call system not ready yet");
        return;
      }
      if (!callContext.currentCall) {
        console.error("📞 useCallManager: No active call to end");
        return;
      }

      console.log("📞 useCallManager: endCall() called");
      console.log("  -> callId:", callContext.currentCall.callId);
      console.log("  -> direction:", callContext.currentCall.direction);
      console.log("  -> duration:", callContext.currentCall.duration);

      // ✅ FIX 1: Reset lock on end
      callAcceptedHandledRef.current = false;

      if (webrtcManager) {
        console.log("📞 useCallManager: Cleaning up WebRTC...");
        webrtcManager.cleanup();
      }

      const duration = callContext.currentCall.duration || 0;
      console.log("📞 useCallManager: Call duration:", duration, "seconds");

      console.log("📞 useCallManager: Emitting callEnded event to server...");
      socket.emit("callEnded", {
        callId: callContext.currentCall.callId,
        endedBy: user._id,
        duration,
        timestamp: new Date().toISOString()
      });

      console.log("📞 useCallManager: Ending call in context...");
      callContext.endCall();

      console.log("📞 useCallManager: Scheduling call clear in 2 seconds...");
      setTimeout(() => {
        callContext.clearCall();
      }, 2000);

      clearTimeout(callRejectionTimeoutRef.current);
      clearTimeout(connectionTimeoutRef.current);

      console.log("📞 useCallManager: Call ended successfully");

      if (onCallStateChange) {
        onCallStateChange('ended');
      }
    } catch (error) {
      console.error("📞 useCallManager: Error ending call:", error);
    }
  }, [callContext, socket, user, webrtcManager, onCallStateChange]);

  useEffect(() => { rejectCallRef.current = rejectCall; }, [rejectCall]);
  useEffect(() => { endCallRef.current = endCall; }, [endCall]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join', {
      userId: user._id,
      userName: user.name,
      userImage: user.profilePicUrl
    });

    console.log('📞 useCallManager: Joined call handlers with user info');
  }, [socket, user]);

  useEffect(() => {
    if (!socket) {
      console.log("📞 useCallManager: Socket not available - skipping socket listener setup");
      return;
    }

    console.log("📞 useCallManager: Setting up socket listeners for call events...");
    console.log("  -> socket.id:", socket.id);

    const handleIncomingCall = (callData) => {
      console.log("📞 useCallManager: handleIncomingCall() - Received incoming call");
      console.log("  -> callId:", callData.callId);
      console.log("  -> callType:", callData.callType);
      console.log("  -> initiatorId:", callData.initiatorId);
      console.log("  -> initiatorName:", callData.initiatorName);

      // ✅ FIX 1: Reset the lock for a fresh incoming call
      callAcceptedHandledRef.current = false;

      const ctx = callContextRef.current;
      if (ctx.hasActiveCall()) {
        console.warn("📞 useCallManager: Cannot accept call - another call is active");
        socket.emit("callRejected", {
          callId: callData.callId,
          rejecterId: user._id,
          reason: "busy"
        });
        return;
      }

      const fullCallData = {
        ...callData,
        type: callData.callType,
        receiverId: user._id
      };
      console.log("📞 useCallManager: Handling incoming call in context...");
      ctx.handleIncomingCall(fullCallData);
      ctx.setCallStatusMessage(`📞 Incoming ${callData.callType || 'audio'} call from ${callData.initiatorName || 'unknown'}`);

      console.log("📞 useCallManager: Playing ringtone...");
      try {
        ringtoneSoundRef.current.loop = true;
        ringtoneSoundRef.current.play().catch(err =>
          console.log("📞 useCallManager: Ringtone play failed:", err)
        );
      } catch (error) {
        console.log("📞 useCallManager: Could not play ringtone:", error);
      }

      console.log("📞 useCallManager: Setting 30s auto-reject timeout...");
      callRejectionTimeoutRef.current = setTimeout(() => {
        console.log("📞 useCallManager: Auto-rejecting call - no answer");
        rejectCallRef.current?.("missed");
      }, 30000);
    };

    // ✅ FIX 1: Replaced the entire handleCallAcceptedAck with ref-based lock
    const handleCallAcceptedAck = async (data) => {
      console.log("📞 useCallManager: handleCallAcceptedAck() - Call was accepted by remote user");
      console.log("  -> data:", data);

      // ✅ This ref check is immune to stale React state — if it already ran once, stop immediately
      if (callAcceptedHandledRef.current) {
        console.log("📞 useCallManager: Ignoring duplicate callAcceptedAck — already handled");
        return;
      }
      callAcceptedHandledRef.current = true;

      const ctx = callContextRef.current;
      if (!ctx?.currentCall) {
        console.log("📞 useCallManager: Ignoring callAcceptedAck — no active call");
        return;
      }

      clearTimeout(callRejectionTimeoutRef.current);
      ctx.setCallConnecting();
      ctx.setCallStatusMessage('🔗 Connecting...');

      const wrtc = webrtcManagerRef.current;
      if (wrtc) {
        console.log("📞 useCallManager: Initializing WebRTC — initiator creates offer");
        await new Promise(resolve => setTimeout(resolve, 150));
        wrtc.initialize().catch(error => {
          console.error("📞 useCallManager: WebRTC init failed:", error);
          ctx.setError("Failed to establish connection");
          endCallRef.current?.();
        });
      } else {
        console.warn("📞 useCallManager: webrtcManager not available");
      }

      if (onCallStateChange) onCallStateChange('accepted');
    };

    const handleCallRejectedAck = (data) => {
      console.log("📞 useCallManager: handleCallRejectedAck() - Call was rejected by remote user");
      console.log("  -> reason:", data.reason);
      clearTimeout(callRejectionTimeoutRef.current);
      console.log("📞 useCallManager: Clearing rejection timeout");

      const ctx = callContextRef.current;
      let userMessage = "Call rejected";
      if (data.reason === 'offline') userMessage = "📴 User is offline — call could not connect";
      else if (data.reason === 'busy') userMessage = "⏳ User is busy";
      else if (data.reason === 'declined') userMessage = "❌ Call declined";
      else if (data.reason === 'timeout') userMessage = "⏱️ No response — call timed out";

      console.log("📞 useCallManager: Setting call status message:", userMessage);
      ctx.setCallStatusMessage(userMessage);
      ctx.rejectCall(data.reason);
      setTimeout(() => ctx.clearCall(), 2000);
      if (onCallStateChange) onCallStateChange('rejected');
    };

    const handleCallEndedAck = (data) => {
      console.log("📞 useCallManager: handleCallEndedAck() - Call ended by remote user");
      console.log("  -> data:", data);

      const wrtc = webrtcManagerRef.current;
      if (wrtc) {
        console.log("📞 useCallManager: Cleaning up WebRTC...");
        wrtc.cleanup();
      }

      const ctx = callContextRef.current;
      console.log("📞 useCallManager: Ending call in context...");
      ctx.endCall();
      ctx.setCallStatusMessage('Call ended');
      setTimeout(() => ctx.clearCall(), 2000);
      if (onCallStateChange) onCallStateChange('ended');
    };

    // ✅ FIX 3: Don't end call on InvalidStateError — it's a duplicate offer, not fatal
    const handleWebrtcOffer = async (data) => {
      console.log("📞 useCallManager: handleWebrtcOffer() - Received WebRTC offer");
      console.log("  -> callId:", data.callId);
      const wrtc = webrtcManagerRef.current;
      if (wrtc?.handleOffer) {
        try {
          console.log("📞 useCallManager: Handling WebRTC offer...");
          await wrtc.handleOffer(data.sdp);
          console.log("📞 useCallManager: WebRTC offer handled successfully");
        } catch (error) {
          // ✅ InvalidStateError means duplicate offer — do NOT end the call
          if (error.name === "InvalidStateError") {
            console.warn("📞 useCallManager: Duplicate offer ignored — not ending call:", error.message);
            return;
          }
          console.error("📞 useCallManager: Error handling offer:", error);
          callContextRef.current?.setError("Connection error - please try again");
          endCallRef.current?.();
        }
      } else {
        console.warn("📞 useCallManager: webrtcManager.handleOffer not available");
      }
    };

    const handleWebrtcAnswer = async (data) => {
      console.log("📞 useCallManager: handleWebrtcAnswer() - Received WebRTC answer");
      console.log("  -> callId:", data.callId);
      const wrtc = webrtcManagerRef.current;
      if (wrtc?.handleAnswer) {
        try {
          console.log("📞 useCallManager: Handling WebRTC answer...");
          await wrtc.handleAnswer(data.sdp);
          console.log("📞 useCallManager: WebRTC answer handled successfully");
        } catch (error) {
          console.error("📞 useCallManager: Error handling answer:", error);
          console.warn("📞 useCallManager: Answer error ignored (likely duplicate)");
        }
      } else {
        console.warn("📞 useCallManager: webrtcManager.handleAnswer not available");
      }
    };

    const handleWebrtcIceCandidate = (data) => {
      console.log("📞 useCallManager: handleWebrtcIceCandidate() - Received ICE candidate");
      const wrtc = webrtcManagerRef.current;
      if (wrtc?.handleIceCandidate) {
        wrtc.handleIceCandidate(data.candidate);
      } else {
        console.warn("📞 useCallManager: webrtcManager.handleIceCandidate not available");
      }
    };

    console.log("📞 useCallManager: Registering socket event listeners...");
    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAcceptedAck", handleCallAcceptedAck);
    socket.on("callRejectedAck", handleCallRejectedAck);
    socket.on("callEndedAck", handleCallEndedAck);
    socket.on("webrtcOffer", handleWebrtcOffer);
    socket.on("webrtcAnswer", handleWebrtcAnswer);
    socket.on("webrtcIceCandidate", handleWebrtcIceCandidate);
    console.log("📞 useCallManager: Socket event listeners registered successfully");

    return () => {
      console.log("📞 useCallManager: Cleaning up socket event listeners...");
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAcceptedAck", handleCallAcceptedAck);
      socket.off("callRejectedAck", handleCallRejectedAck);
      socket.off("callEndedAck", handleCallEndedAck);
      socket.off("webrtcOffer", handleWebrtcOffer);
      socket.off("webrtcAnswer", handleWebrtcAnswer);
      socket.off("webrtcIceCandidate", handleWebrtcIceCandidate);
      console.log("📞 useCallManager: Socket event listeners cleaned up");
    };
  }, [socket]);

  return {
    initiateCall,
    acceptCall,
    answerCall: acceptCall,
    rejectCall,
    endCall
  };
};

export default useCallManager;