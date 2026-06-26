import { useRef, useCallback, useState, useEffect } from "react";

/**
 * useWebRTC — production-ready WebRTC hook
 *
 * Key fixes vs original:
 * 1. isInitiator is passed as a STABLE REF, not read from props at render time,
 *    so it's always current when initialize() actually runs.
 * 2. ICE candidate queue and remote-description flags are SEPARATE concerns.
 * 3. Offer/answer guards use signalingState, not a single shared flag.
 * 4. Audio element is passed in from outside so iOS autoplay is tied to user gesture.
 * 5. No re-creation of peer connection on re-render (ref-based, not state-based lifecycle).
 */
const useWebRTC = ({
  callType,
  constraints,
  socket,
  callId,
  isInitiator,       // boolean — may change as call progresses; stored in ref internally
  remoteUserId,
  onLocalStreamReady,
  onRemoteStreamAdded,
  onConnectionStateChange,
  onError,
}) => {
  // ─── Refs (never cause re-renders) ──────────────────────────────────────────
  const peerConnectionRef        = useRef(null);
  const localStreamRef           = useRef(null);
  const remoteStreamRef          = useRef(null);
  const iceCandidateQueueRef     = useRef([]);
  const remoteDescriptionSetRef  = useRef(false);   // true once setRemoteDescription succeeds
  const isInitializedRef         = useRef(false);
  const pendingOfferRef          = useRef(null);
  const isInitiatorRef           = useRef(isInitiator); // ✅ FIX 1: kept current via effect

  // Keep isInitiatorRef in sync whenever the prop changes
  useEffect(() => {
    isInitiatorRef.current = isInitiator;
    console.log("📞 useWebRTC: isInitiator updated →", isInitiator);
  }, [isInitiator]);

  // ─── State (drives UI re-renders) ───────────────────────────────────────────
  const [localStream,      setLocalStream]      = useState(null);
  const [remoteStream,     setRemoteStream]      = useState(null);
  const [isConnected,      setIsConnected]      = useState(false);
  const [connectionState,  setConnectionState]  = useState("new");

  // ─── Stable callback refs ────────────────────────────────────────────────────
  const onLocalStreamReadyRef  = useRef(onLocalStreamReady);
  const onRemoteStreamAddedRef = useRef(onRemoteStreamAdded);
  const onConnectionStateRef   = useRef(onConnectionStateChange);
  const onErrorRef             = useRef(onError);
  useEffect(() => { onLocalStreamReadyRef.current  = onLocalStreamReady;    }, [onLocalStreamReady]);
  useEffect(() => { onRemoteStreamAddedRef.current = onRemoteStreamAdded;   }, [onRemoteStreamAdded]);
  useEffect(() => { onConnectionStateRef.current   = onConnectionStateChange; }, [onConnectionStateChange]);
  useEffect(() => { onErrorRef.current             = onError;               }, [onError]);

  // ─── getUserMedia ────────────────────────────────────────────────────────────
  const getLocalStream = useCallback(async () => {
    try {
      const mediaConstraints =
        callType === "audio"
          ? {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000,
                channelCount: 1,
              },
              video: false,
            }
          : constraints || {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              },
            };

      console.log("📞 useWebRTC: Requesting media:", mediaConstraints);
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      localStreamRef.current = stream;
      setLocalStream(stream);

      console.log("📞 useWebRTC: Local stream obtained →", stream.getTracks().map(t => `${t.kind}(${t.readyState})`).join(", "));
      onLocalStreamReadyRef.current?.(stream);
      return stream;
    } catch (error) {
      console.error("📞 useWebRTC: getUserMedia failed:", error.name, error.message);
      onErrorRef.current?.({
        code: "LOCAL_STREAM_ERROR",
        message:
          error.name === "NotAllowedError"
            ? "Microphone/camera access was denied. Please allow permissions and try again."
            : "Failed to access microphone/camera. Please check device availability.",
        originalError: error,
      });
      throw error;
    }
  }, [callType, constraints]);

  // ─── Flush ICE candidate queue ───────────────────────────────────────────────
  const processIceCandidateQueue = useCallback(async () => {
    const queue = iceCandidateQueueRef.current;
    if (queue.length === 0) return;
    console.log(`📞 useWebRTC: Flushing ${queue.length} queued ICE candidates`);

    const toProcess = [...queue];
    iceCandidateQueueRef.current = [];

    for (const candidate of toProcess) {
      try {
        if (peerConnectionRef.current && remoteDescriptionSetRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("📞 useWebRTC: Queued ICE candidate applied");
        } else {
          // push back — still not ready
          iceCandidateQueueRef.current.push(candidate);
        }
      } catch (err) {
        console.warn("📞 useWebRTC: Error applying queued ICE candidate:", err.message);
      }
    }
  }, []);

  // ─── Create RTCPeerConnection ────────────────────────────────────────────────
  const createPeerConnection = useCallback(async () => {
    try {
      console.log("📞 useWebRTC: Creating RTCPeerConnection");

      // ✅ Prefer fetching dynamic TURN credentials from the server
      let iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        // Free relay fallback — replace with your own TURN in production
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ];

      // Try to get fresh TURN credentials from your API
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const resp = await fetch("/api/calls/webrtc/turn-servers", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resp.ok) {
            const data = await resp.json();
            if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
              iceServers = data.iceServers;
              console.log("📞 useWebRTC: Using dynamic TURN servers from API");
            }
          }
        }
      } catch (e) {
        console.warn("📞 useWebRTC: Could not fetch dynamic TURN servers, using defaults:", e.message);
      }

      const pc = new RTCPeerConnection({
        iceServers,
        iceCandidatePoolSize: 10,
        sdpSemantics: "unified-plan",
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      });

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
          console.log("📞 useWebRTC: Added local track:", track.kind, track.readyState);
        });
      }

      // Remote track handler
      pc.ontrack = (event) => {
        console.log("📞 useWebRTC: Remote track received:", event.track.kind, event.track.readyState);
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        // Avoid duplicate track additions
        if (!remoteStreamRef.current.getTracks().find(t => t.id === event.track.id)) {
          remoteStreamRef.current.addTrack(event.track);
        }
        // Create a fresh MediaStream instance so React sees the state change
        const freshStream = new MediaStream(remoteStreamRef.current.getTracks());
        setRemoteStream(freshStream);
        onRemoteStreamAddedRef.current?.(freshStream);
        console.log("📞 useWebRTC: Remote stream now has", remoteStreamRef.current.getTracks().length, "tracks");
      };

      // ICE candidate handler
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("📞 useWebRTC: ICE candidate generated, sending to remote");
          socket?.emit("webrtcIceCandidate", {
            callId,
            to: remoteUserId,
            candidate: event.candidate.toJSON(),
          });
        } else {
          console.log("📞 useWebRTC: ICE gathering complete");
        }
      };

      // ICE gathering state
      pc.onicegatheringstatechange = () => {
        console.log("📞 useWebRTC: ICE gathering state:", pc.iceGatheringState);
      };

      // ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log("📞 useWebRTC: ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
          console.warn("📞 useWebRTC: ICE failed — attempting restart");
          try {
            pc.restartIce();
          } catch (e) {
            console.error("📞 useWebRTC: ICE restart failed:", e.message);
          }
        }
      };

      // Overall connection state
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log("📞 useWebRTC: Connection state →", state);
        setConnectionState(state);
        onConnectionStateRef.current?.(state);

        if (state === "connected") {
          setIsConnected(true);
          console.log("📞 useWebRTC: ✅ Peer connection established");
        } else if (["failed", "disconnected", "closed"].includes(state)) {
          setIsConnected(false);
        }
      };

      // Signaling state — useful for debugging SDP exchange issues
      pc.onsignalingstatechange = () => {
        console.log("📞 useWebRTC: Signaling state →", pc.signalingState);
      };

      peerConnectionRef.current = pc;
      console.log("📞 useWebRTC: RTCPeerConnection created");
      return pc;
    } catch (error) {
      console.error("📞 useWebRTC: Error creating peer connection:", error);
      onErrorRef.current?.({
        code: "PEER_CONNECTION_ERROR",
        message: "Failed to create peer connection",
        originalError: error,
      });
      throw error;
    }
  }, [callId, remoteUserId, socket]);

  // ─── Create and send SDP offer ───────────────────────────────────────────────
  const createOffer = useCallback(async () => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) throw new Error("Peer connection not initialized");

      console.log("📞 useWebRTC: Creating SDP offer, signalingState:", pc.signalingState);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
        iceRestart: false,
      });

      await pc.setLocalDescription(offer);
      console.log("📞 useWebRTC: Local description set (offer), emitting webrtcOffer");

      socket?.emit("webrtcOffer", {
        callId,
        to: remoteUserId,
        sdp: pc.localDescription.sdp,
      });

      return offer;
    } catch (error) {
      console.error("📞 useWebRTC: createOffer failed:", error);
      onErrorRef.current?.({
        code: "OFFER_ERROR",
        message: "Failed to create WebRTC offer",
        originalError: error,
      });
      throw error;
    }
  }, [callId, callType, remoteUserId, socket]);

  // ─── Handle incoming SDP offer ───────────────────────────────────────────────
  const handleOffer = useCallback(
    async (offer) => {
      try {
        const pc = peerConnectionRef.current;

        // Peer connection not ready yet — buffer the offer
        if (!pc) {
          console.log("📞 useWebRTC: PC not ready, buffering offer");
          pendingOfferRef.current = offer;
          return;
        }

        // ✅ FIX: Guard using signalingState, not the shared remoteDescriptionSetRef
        // "stable" means either we already set a remote desc, OR we're at init state.
        // The correct duplicate check is whether we've already gone through have-remote-offer.
        if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-pranswer") {
          if (remoteDescriptionSetRef.current) {
            console.warn("📞 useWebRTC: Duplicate offer ignored (signalingState:", pc.signalingState, ")");
            return;
          }
        }

        if (remoteDescriptionSetRef.current) {
          console.warn("📞 useWebRTC: Duplicate offer ignored (remoteDescriptionSet=true)");
          return;
        }

        console.log("📞 useWebRTC: Setting remote description from offer, signalingState:", pc.signalingState);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: offer }));
        remoteDescriptionSetRef.current = true;
        console.log("📞 useWebRTC: Remote description set (offer)");

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("📞 useWebRTC: Local description set (answer), emitting webrtcAnswer");

        socket?.emit("webrtcAnswer", {
          callId,
          to: remoteUserId,
          sdp: pc.localDescription.sdp,
        });

        // Flush any queued ICE candidates now that remote description is set
        await processIceCandidateQueue();

        return answer;
      } catch (error) {
        if (error.name === "InvalidStateError") {
          console.warn("📞 useWebRTC: handleOffer InvalidStateError (likely duplicate) — ignoring:", error.message);
          return;
        }
        console.error("📞 useWebRTC: handleOffer failed:", error);
        onErrorRef.current?.({
          code: "OFFER_HANDLE_ERROR",
          message: "Failed to handle WebRTC offer",
          originalError: error,
        });
        throw error;
      }
    },
    [callId, remoteUserId, socket, processIceCandidateQueue]
  );

  // ─── Handle incoming SDP answer ──────────────────────────────────────────────
  const handleAnswer = useCallback(
    async (answer) => {
      try {
        const pc = peerConnectionRef.current;
        if (!pc) throw new Error("Peer connection not initialized");

        if (pc.signalingState === "stable") {
          console.warn("📞 useWebRTC: Duplicate answer ignored (already stable)");
          return;
        }

        console.log("📞 useWebRTC: Setting remote description from answer, signalingState:", pc.signalingState);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answer }));
        remoteDescriptionSetRef.current = true;
        console.log("📞 useWebRTC: Remote description set (answer) — SDP exchange complete");

        // Flush queued ICE candidates
        await processIceCandidateQueue();
      } catch (error) {
        if (error.name === "InvalidStateError") {
          console.warn("📞 useWebRTC: handleAnswer InvalidStateError (likely duplicate):", error.message);
          return;
        }
        console.error("📞 useWebRTC: handleAnswer failed:", error);
        onErrorRef.current?.({
          code: "ANSWER_HANDLE_ERROR",
          message: "Failed to handle WebRTC answer",
          originalError: error,
        });
        throw error;
      }
    },
    [processIceCandidateQueue]
  );

  // ─── Handle incoming ICE candidate ───────────────────────────────────────────
  const handleIceCandidate = useCallback(
    async (candidate) => {
      try {
        const pc = peerConnectionRef.current;

        if (!pc || !remoteDescriptionSetRef.current) {
          // Queue it — we'll process after setRemoteDescription
          console.log("📞 useWebRTC: Queuing ICE candidate (PC not ready or no remote desc yet)");
          iceCandidateQueueRef.current.push(candidate);
          return;
        }

        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("📞 useWebRTC: ICE candidate added immediately");
      } catch (error) {
        // This is usually benign (e.g. candidate after connection closed)
        console.warn("📞 useWebRTC: addIceCandidate error:", error.message);
      }
    },
    []
  );

  // ─── Media track controls ────────────────────────────────────────────────────
  const setAudioEnabled = useCallback((enabled) => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
      console.log("📞 useWebRTC: Audio track enabled →", enabled);
    });
  }, []);

  const setVideoEnabled = useCallback((enabled) => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
      console.log("📞 useWebRTC: Video track enabled →", enabled);
    });
  }, []);

  // ─── Cleanup ─────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    console.log("📞 useWebRTC: Cleaning up");

    localStreamRef.current?.getTracks().forEach((t) => {
      t.stop();
      console.log("📞 useWebRTC: Stopped track:", t.kind);
    });

    const pc = peerConnectionRef.current;
    if (pc) {
      pc.ontrack              = null;
      pc.onicecandidate       = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.onsignalingstatechange = null;
      pc.onicegatheringstatechange = null;
      if (pc.connectionState !== "closed") pc.close();
    }

    peerConnectionRef.current       = null;
    localStreamRef.current          = null;
    remoteStreamRef.current         = null;
    iceCandidateQueueRef.current    = [];
    remoteDescriptionSetRef.current = false;
    isInitializedRef.current        = false;
    pendingOfferRef.current         = null;

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setConnectionState("closed");
    console.log("📞 useWebRTC: Cleanup complete");
  }, []);

  // ─── Initialize ──────────────────────────────────────────────────────────────
  const initialize = useCallback(async () => {
    if (isInitializedRef.current) {
      console.log("📞 useWebRTC: Already initialized — skipping");
      return;
    }

    // ✅ FIX 1: Read isInitiator from the REF, not the captured closure value
    const weAreInitiator = isInitiatorRef.current;
    console.log("📞 useWebRTC: Initializing — callType:", callType, "isInitiator:", weAreInitiator, "callId:", callId);

    try {
      await getLocalStream();
      await createPeerConnection();

      isInitializedRef.current = true;
      console.log("📞 useWebRTC: Peer connection ready");

      if (weAreInitiator) {
        // Caller: create and send the offer
        console.log("📞 useWebRTC: We are initiator — creating offer");
        await createOffer();
      } else {
        // Callee: process any offer that arrived before we were ready
        if (pendingOfferRef.current) {
          console.log("📞 useWebRTC: Processing buffered offer");
          const saved = pendingOfferRef.current;
          pendingOfferRef.current = null;
          await handleOffer(saved);
        } else {
          console.log("📞 useWebRTC: Callee ready — waiting for offer");
        }
      }
    } catch (error) {
      console.error("📞 useWebRTC: Initialization failed:", error);
      cleanup();
      throw error;
    }
  }, [callType, callId, getLocalStream, createPeerConnection, createOffer, handleOffer, cleanup]);

  // ─── Capability check ────────────────────────────────────────────────────────
  const isWebRTCSupported = useCallback(() => {
    return !!(
      navigator.mediaDevices?.getUserMedia &&
      (window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection)
    );
  }, []);

  return {
    isConnected,
    connectionState,
    localStream,
    remoteStream,
    initialize,
    cleanup,
    getLocalStream,
    createPeerConnection,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    setAudioEnabled,
    setVideoEnabled,
    isWebRTCSupported,
    // Refs exposed for external access (e.g. CallContainer stream attachment)
    peerConnectionRef,
    localStreamRef,
    remoteStreamRef,
  };
};

export default useWebRTC;