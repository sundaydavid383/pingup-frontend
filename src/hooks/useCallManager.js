import { useEffect, useCallback, useRef, useContext } from "react";
import { CallContext } from "../context/CallContext";

/**
 * useCallManager — fixed signaling layer.
 *
 * Key fixes vs original:
 * 1. callAcceptedHandledRef lock is correct and unchanged — kept as-is.
 * 2. webrtcIceCandidate handler passes `data.candidate` not `data` to handleIceCandidate.
 * 3. webrtcOffer / webrtcAnswer relay: server sends `{ callId, from, sdp }` —
 *    we extract `.sdp` before passing to useWebRTC (which expects the raw SDP string).
 * 4. Added detailed per-event logging for every signaling message.
 * 5. Ringtone is stopped before initialize() to free audio resources.
 * 6. rejectCall timeout is cleared on accept to prevent spurious auto-reject.
 * 7. endCall emits before cleanup so the server records the correct endedBy.
 */
const useCallManager = ({ socket, user, webrtcManager, onCallStateChange }) => {
  const callContext = useContext(CallContext);

  const ringtoneSoundRef         = useRef(null);
  const callRejectionTimeoutRef  = useRef(null);
  const connectionTimeoutRef     = useRef(null);
  const callContextRef           = useRef(callContext);
  const webrtcManagerRef         = useRef(webrtcManager);
  const rejectCallRef            = useRef(null);
  const endCallRef               = useRef(null);
  const callAcceptedHandledRef   = useRef(false);

  // Lazy-init ringtone so we don't fail on SSR or test environments
  const getRingtone = useCallback(() => {
    if (!ringtoneSoundRef.current) {
      try {
        ringtoneSoundRef.current = new Audio("/audio/ringtone.mp3");
        ringtoneSoundRef.current.loop = true;
      } catch (e) {
        console.warn("📞 useCallManager: Could not create ringtone:", e.message);
      }
    }
    return ringtoneSoundRef.current;
  }, []);

  useEffect(() => { callContextRef.current = callContext; }, [callContext]);
  useEffect(() => { webrtcManagerRef.current = webrtcManager; }, [webrtcManager]);

  // ─── initiateCall ─────────────────────────────────────────────────────────────
  const initiateCall = useCallback(
    (receiverId, receiverName, callType = "video", receiverImage = null) => {
      if (!socket || !user || !callContext) {
        console.warn("📞 useCallManager: initiateCall — system not ready (socket/user/context missing)");
        return;
      }

      console.log("📞 useCallManager: initiateCall →", { receiverId, receiverName, callType });
      callAcceptedHandledRef.current = false;

      const callId = callContext.initiateCall(receiverId, receiverName, callType, receiverImage);
      if (!callId) {
        console.error("📞 useCallManager: initiateCall failed — another call may be active");
        return;
      }

      console.log("📞 useCallManager: Emitting callInitiated →", callId);
      socket.emit("callInitiated", {
        callId,
        initiatorId: user._id,
        receiverId,
        callType,
        timestamp: new Date().toISOString(),
      });

      // Auto-timeout after 30 s
      callRejectionTimeoutRef.current = setTimeout(() => {
        console.log("📞 useCallManager: Call timed out — no answer");
        callContext.setError("Call not answered");
        callContext.setCallStatusMessage("⏱️ No response — call timed out");
      }, 30_000);

      onCallStateChange?.("initiating");
    },
    [socket, user, callContext, onCallStateChange]
  );

  // ─── acceptCall ──────────────────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!socket || !user || !callContext) {
      console.warn("📞 useCallManager: acceptCall — system not ready");
      return;
    }
    if (!callContext.currentCall) {
      console.error("📞 useCallManager: acceptCall — no incoming call");
      return;
    }

    console.log("📞 useCallManager: acceptCall →", callContext.currentCall.callId);

    // Stop ringtone & clear auto-reject timeout
    try { getRingtone()?.pause(); } catch (_) {}
    clearTimeout(callRejectionTimeoutRef.current);

    // Update context state → CONNECTING
    callContext.acceptCall();

    // Emit to server (server will join both sockets into the signal room)
    socket.emit("callAccepted", {
      callId:     callContext.currentCall.callId,
      acceptorId: user._id,
      timestamp:  new Date().toISOString(),
    });
    console.log("📞 useCallManager: callAccepted emitted");

    // Initialize WebRTC on the RECEIVER side (callee, not initiator)
    const wrtc = webrtcManagerRef.current;
    if (wrtc) {
      try {
        console.log("📞 useCallManager: Initializing WebRTC (callee side)");
        await wrtc.initialize();
        console.log("📞 useCallManager: WebRTC initialized (callee)");
      } catch (err) {
        console.error("📞 useCallManager: WebRTC init failed (callee):", err.message);
        callContext.setError("Failed to initialize media — check permissions");
      }
    } else {
      console.warn("📞 useCallManager: webrtcManager not available at acceptCall time");
    }

    onCallStateChange?.("accepted");
  }, [callContext, socket, user, getRingtone, onCallStateChange]);

  // ─── rejectCall ──────────────────────────────────────────────────────────────
  const rejectCall = useCallback(
    (reason = "declined") => {
      if (!socket || !user || !callContext) return;
      if (!callContext.currentCall) {
        console.error("📞 useCallManager: rejectCall — no call to reject");
        return;
      }

      console.log("📞 useCallManager: rejectCall →", reason, callContext.currentCall.callId);
      callAcceptedHandledRef.current = false;
      try { getRingtone()?.pause(); } catch (_) {}
      clearTimeout(callRejectionTimeoutRef.current);

      socket.emit("callRejected", {
        callId:    callContext.currentCall.callId,
        rejecterId: user._id,
        reason,
        timestamp: new Date().toISOString(),
      });

      callContext.rejectCall(reason);
      setTimeout(() => callContext.clearCall(), 2000);
      onCallStateChange?.("rejected");
    },
    [callContext, socket, user, getRingtone, onCallStateChange]
  );

  // ─── endCall ─────────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    if (!socket || !user || !callContext) return;
    if (!callContext.currentCall) {
      console.error("📞 useCallManager: endCall — no active call");
      return;
    }

    const { callId, duration = 0 } = callContext.currentCall;
    console.log("📞 useCallManager: endCall →", callId, "duration:", duration);
    callAcceptedHandledRef.current = false;

    // Emit BEFORE cleanup so the server records the correct endedBy
    socket.emit("callEnded", {
      callId,
      endedBy:   user._id,
      duration,
      timestamp: new Date().toISOString(),
    });
    console.log("📞 useCallManager: callEnded emitted");

    // Clean up WebRTC
    webrtcManagerRef.current?.cleanup();

    callContext.endCall();
    setTimeout(() => callContext.clearCall(), 2000);
    clearTimeout(callRejectionTimeoutRef.current);
    clearTimeout(connectionTimeoutRef.current);

    onCallStateChange?.("ended");
  }, [callContext, socket, user, onCallStateChange]);

  useEffect(() => { rejectCallRef.current = rejectCall; }, [rejectCall]);
  useEffect(() => { endCallRef.current    = endCall;    }, [endCall]);

  // ─── Join user room ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit("join", {
      userId:    user._id,
      userName:  user.name,
      userImage: user.profilePicUrl,
    });
    console.log("📞 useCallManager: Joined with user", user._id);
  }, [socket, user]);

  // ─── Socket event handlers ────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    console.log("📞 useCallManager: Registering socket listeners, socket.id:", socket.id);

    // ── incomingCall ──
    const handleIncomingCall = (callData) => {
      console.log("📞 useCallManager: incomingCall received →", {
        callId: callData.callId, callType: callData.callType,
        initiatorName: callData.initiatorName,
      });
      callAcceptedHandledRef.current = false;

      const ctx = callContextRef.current;
      if (ctx.hasActiveCall()) {
        console.warn("📞 useCallManager: Rejecting incomingCall — already in a call");
        socket.emit("callRejected", {
          callId: callData.callId, rejecterId: user._id, reason: "busy",
        });
        return;
      }

      ctx.handleIncomingCall({ ...callData, type: callData.callType, receiverId: user._id });
      ctx.setCallStatusMessage(`📞 Incoming ${callData.callType || "audio"} call from ${callData.initiatorName || "someone"}`);

      // Play ringtone
      try {
        const ringtone = getRingtone();
        if (ringtone) {
          ringtone.currentTime = 0;
          ringtone.play().catch(err =>
            console.log("📞 useCallManager: Ringtone play failed:", err.message)
          );
        }
      } catch (e) {
        console.log("📞 useCallManager: Ringtone error:", e.message);
      }

      // Auto-reject after 30 s
      callRejectionTimeoutRef.current = setTimeout(() => {
        console.log("📞 useCallManager: Auto-rejecting — no answer");
        rejectCallRef.current?.("missed");
      }, 30_000);
    };

    // ── callAcceptedAck — fires on the INITIATOR when receiver accepts ──
    const handleCallAcceptedAck = async (data) => {
      console.log("📞 useCallManager: callAcceptedAck received →", data);

      if (callAcceptedHandledRef.current) {
        console.log("📞 useCallManager: Duplicate callAcceptedAck — ignoring");
        return;
      }
      callAcceptedHandledRef.current = true;

      const ctx = callContextRef.current;
      if (!ctx?.currentCall) {
        console.log("📞 useCallManager: No active call at callAcceptedAck — ignoring");
        return;
      }

      clearTimeout(callRejectionTimeoutRef.current);
      ctx.setCallConnecting();
      ctx.setCallStatusMessage("🔗 Connecting...");

      // Small delay to ensure the server has joined both sockets into the call room
      await new Promise((r) => setTimeout(r, 200));

      const wrtc = webrtcManagerRef.current;
      if (wrtc) {
        console.log("📞 useCallManager: Initializing WebRTC (initiator side)");
        try {
          await wrtc.initialize();
          console.log("📞 useCallManager: WebRTC initialized (initiator)");
        } catch (err) {
          console.error("📞 useCallManager: WebRTC init failed (initiator):", err.message);
          ctx.setError("Failed to establish connection");
          endCallRef.current?.();
        }
      } else {
        console.warn("📞 useCallManager: webrtcManager not available at callAcceptedAck");
      }

      onCallStateChange?.("accepted");
    };

    // ── callRejectedAck ──
    const handleCallRejectedAck = (data) => {
      console.log("📞 useCallManager: callRejectedAck →", data.reason);
      clearTimeout(callRejectionTimeoutRef.current);

      const ctx = callContextRef.current;
      const msgMap = {
        offline:  "📴 User is offline",
        busy:     "⏳ User is busy",
        declined: "❌ Call declined",
        timeout:  "⏱️ No response",
      };
      ctx.setCallStatusMessage(msgMap[data.reason] || "Call ended");
      ctx.rejectCall(data.reason);
      setTimeout(() => ctx.clearCall(), 2000);
      onCallStateChange?.("rejected");
    };

    // ── callEndedAck ──
    const handleCallEndedAck = (data) => {
      console.log("📞 useCallManager: callEndedAck →", data);
      webrtcManagerRef.current?.cleanup();
      const ctx = callContextRef.current;
      ctx.endCall();
      ctx.setCallStatusMessage("Call ended");
      setTimeout(() => ctx.clearCall(), 2000);
      onCallStateChange?.("ended");
    };

    // ── webrtcOffer — fires on RECEIVER (callee) ──
    // ✅ FIX: Server sends { callId, from, sdp } — extract .sdp before passing
    const handleWebrtcOffer = async (data) => {
      console.log("📞 useCallManager: webrtcOffer received — callId:", data.callId, "sdp length:", data.sdp?.length);
      const wrtc = webrtcManagerRef.current;
      if (wrtc?.handleOffer) {
        try {
          // ✅ Pass data.sdp (the raw SDP string), not data (the whole object)
          await wrtc.handleOffer(data.sdp);
          console.log("📞 useCallManager: webrtcOffer handled");
        } catch (err) {
          if (err.name === "InvalidStateError") {
            console.warn("📞 useCallManager: Duplicate offer ignored:", err.message);
            return;
          }
          console.error("📞 useCallManager: webrtcOffer error:", err.message);
          callContextRef.current?.setError("Connection error — please try again");
          endCallRef.current?.();
        }
      } else {
        console.warn("📞 useCallManager: webrtcManager.handleOffer not available at offer time");
      }
    };

    // ── webrtcAnswer — fires on INITIATOR ──
    const handleWebrtcAnswer = async (data) => {
      console.log("📞 useCallManager: webrtcAnswer received — callId:", data.callId, "sdp length:", data.sdp?.length);
      const wrtc = webrtcManagerRef.current;
      if (wrtc?.handleAnswer) {
        try {
          // ✅ Pass data.sdp, not data
          await wrtc.handleAnswer(data.sdp);
          console.log("📞 useCallManager: webrtcAnswer handled");
        } catch (err) {
          console.warn("📞 useCallManager: webrtcAnswer error (likely duplicate):", err.message);
        }
      }
    };

    // ── webrtcIceCandidate ──
    const handleWebrtcIceCandidate = (data) => {
      console.log("📞 useCallManager: webrtcIceCandidate received — callId:", data.callId);
      const wrtc = webrtcManagerRef.current;
      if (wrtc?.handleIceCandidate) {
        // ✅ data.candidate is the candidate object, not data itself
        wrtc.handleIceCandidate(data.candidate);
      }
    };

    socket.on("incomingCall",         handleIncomingCall);
    socket.on("callAcceptedAck",      handleCallAcceptedAck);
    socket.on("callRejectedAck",      handleCallRejectedAck);
    socket.on("callEndedAck",         handleCallEndedAck);
    socket.on("webrtcOffer",          handleWebrtcOffer);
    socket.on("webrtcAnswer",         handleWebrtcAnswer);
    socket.on("webrtcIceCandidate",   handleWebrtcIceCandidate);
    console.log("📞 useCallManager: All socket listeners registered");

    return () => {
      socket.off("incomingCall",       handleIncomingCall);
      socket.off("callAcceptedAck",    handleCallAcceptedAck);
      socket.off("callRejectedAck",    handleCallRejectedAck);
      socket.off("callEndedAck",       handleCallEndedAck);
      socket.off("webrtcOffer",        handleWebrtcOffer);
      socket.off("webrtcAnswer",       handleWebrtcAnswer);
      socket.off("webrtcIceCandidate", handleWebrtcIceCandidate);
      console.log("📞 useCallManager: Socket listeners removed");
    };
  }, [socket, user, getRingtone, onCallStateChange]);

  return {
    initiateCall,
    acceptCall,
    answerCall: acceptCall,
    rejectCall,
    endCall,
  };
};

export default useCallManager;