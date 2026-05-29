import { useRef, useCallback, useState } from "react";



const useWebRTC = ({
  callType,
  constraints,
  socket,
  callId,
  isInitiator,
  remoteUserId,
  onLocalStreamReady,
  onRemoteStreamAdded,
  onConnectionStateChange,
  onError,
}) => {
const peerConnectionRef = useRef(null);
const localStreamRef = useRef(null);
const remoteStreamRef = useRef(null);
const iceCandidateQueueRef = useRef([]);
const remoteDescriptionSetRef = useRef(false);
const isInitializedRef = useRef(false);

  // ✅ FIX 1: Use STATE for streams so React re-renders when they arrive
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("new");

 const getLocalStream = useCallback(async () => {
    try {
        const mediaConstraints = callType === "audio"
            ? { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }
            : constraints || { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } };

        console.log("📞 useWebRTC: Requesting media:", mediaConstraints);
        const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

        localStreamRef.current = stream;
        setLocalStream(stream);

        console.log("📞 useWebRTC: Local stream obtained", { tracks: stream.getTracks().map(t => t.kind) });
        onLocalStreamReady?.(stream);
        return stream;
    } catch (error) {
        console.error("📞 useWebRTC: Error getting local stream:", error);
        onError?.({ code: "LOCAL_STREAM_ERROR", message: "Failed to access microphone/camera. Please check permissions.", originalError: error });
        throw error;
    }
}, [callType, constraints, onLocalStreamReady, onError]);


const processIceCandidateQueue = useCallback(async () => {
    console.log(`📞 useWebRTC: Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`);
    while (iceCandidateQueueRef.current.length > 0) {
        const candidate = iceCandidateQueueRef.current.shift();
        try {
            await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.warn("📞 useWebRTC: Error processing queued ICE candidate:", err);
        }
    }
}, []);

const createPeerConnection = useCallback(async () => {
    try {
        console.log("📞 useWebRTC: Creating RTCPeerConnection");

        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
                { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
                { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
            ],
            iceCandidatePoolSize: 10,
        });

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
                console.log("📞 useWebRTC: Added local track:", track.kind);
            });
        }

        peerConnection.ontrack = (event) => {
            console.log("📞 useWebRTC: Remote track received:", event.track.kind);
            if (!remoteStreamRef.current) {
                remoteStreamRef.current = new MediaStream();
            }
            remoteStreamRef.current.addTrack(event.track);
            setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
            onRemoteStreamAdded?.(remoteStreamRef.current);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("📞 useWebRTC: Sending ICE candidate");
                socket?.emit("webrtcIceCandidate", {
                    callId,
                    to: remoteUserId,
                    candidate: {
                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                    },
                });
            } else {
                console.log("📞 useWebRTC: ICE gathering complete");
            }
        };

        peerConnection.onconnectionstatechange = () => {
            const newState = peerConnection.connectionState;
            console.log("📞 useWebRTC: Connection state:", newState);
            setConnectionState(newState);
            onConnectionStateChange?.(newState);
            if (newState === "connected") setIsConnected(true);
            else if (["failed", "disconnected", "closed"].includes(newState)) setIsConnected(false);
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log("📞 useWebRTC: ICE state:", peerConnection.iceConnectionState);
        };

        peerConnectionRef.current = peerConnection;
        return peerConnection;
    } catch (error) {
        console.error("📞 useWebRTC: Error creating peer connection:", error);
        onError?.({ code: "PEER_CONNECTION_ERROR", message: "Failed to create peer connection", originalError: error });
        throw error;
    }
}, [callId, remoteUserId, socket, onConnectionStateChange, onError, onRemoteStreamAdded]);

const createOffer = useCallback(async () => {
    try {
        if (!peerConnectionRef.current) throw new Error("Peer connection not initialized");
        console.log("📞 useWebRTC: Creating offer");
        const offer = await peerConnectionRef.current.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callType === "video",
        });
        await peerConnectionRef.current.setLocalDescription(offer);
        console.log("📞 useWebRTC: Emitting webrtcOffer");
        socket?.emit("webrtcOffer", { callId, to: remoteUserId, sdp: offer.sdp });
        return offer;
    } catch (error) {
        console.error("📞 useWebRTC: Error creating offer:", error);
        onError?.({ code: "OFFER_ERROR", message: "Failed to create WebRTC offer", originalError: error });
        throw error;
    }
}, [callId, callType, remoteUserId, socket, onError]);


const handleOffer = useCallback(async (offer) => {
    try {
        if (!peerConnectionRef.current) throw new Error("Peer connection not initialized");
        console.log("📞 useWebRTC: Handling incoming offer");
        await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription({ type: "offer", sdp: offer })
        );
        remoteDescriptionSetRef.current = true;

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        console.log("📞 useWebRTC: Emitting webrtcAnswer");
        socket?.emit("webrtcAnswer", { callId, to: remoteUserId, sdp: answer.sdp });
        await processIceCandidateQueue();
        return answer;
    } catch (error) {
        console.error("📞 useWebRTC: Error handling offer:", error);
        onError?.({ code: "OFFER_HANDLE_ERROR", message: "Failed to handle WebRTC offer", originalError: error });
        throw error;
    }
}, [callId, remoteUserId, socket, onError, processIceCandidateQueue]);

const handleAnswer = useCallback(async (answer) => {
    try {
        if (!peerConnectionRef.current) throw new Error("Peer connection not initialized");

        if (peerConnectionRef.current.signalingState === "stable") {
            console.warn("📞 useWebRTC: Ignoring duplicate answer — already stable");
            return;
        }

        console.log("📞 useWebRTC: Handling incoming answer");
        await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription({ type: "answer", sdp: answer })
        );
        remoteDescriptionSetRef.current = true;
        await processIceCandidateQueue();
    } catch (error) {
        if (error.name === "InvalidStateError") {
            console.warn("📞 useWebRTC: Ignoring answer in wrong state (likely duplicate):", error.message);
            return;
        }
        console.error("📞 useWebRTC: Error handling answer:", error);
        onError?.({ code: "ANSWER_HANDLE_ERROR", message: "Failed to handle WebRTC answer", originalError: error });
        throw error;
    }
}, [onError, processIceCandidateQueue]);
  


const handleIceCandidate = useCallback(async (candidate) => {
    try {
        if (!peerConnectionRef.current || !remoteDescriptionSetRef.current) {
            console.log("📞 useWebRTC: Queuing ICE candidate");
            iceCandidateQueueRef.current.push(candidate);
            return;
        }
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("📞 useWebRTC: ICE candidate added");
    } catch (error) {
        console.warn("📞 useWebRTC: Error adding ICE candidate:", error);
    }
}, []);

const setAudioEnabled = useCallback((enabled) => {
    localStreamRef.current?.getAudioTracks().forEach(t => (t.enabled = enabled));
    console.log("📞 useWebRTC: Audio enabled:", enabled);
}, []);

const setVideoEnabled = useCallback((enabled) => {
    localStreamRef.current?.getVideoTracks().forEach(t => (t.enabled = enabled));
    console.log("📞 useWebRTC: Video enabled:", enabled);
}, []);

const cleanup = useCallback(() => {
    console.log("📞 useWebRTC: Cleaning up");
    localStreamRef.current?.getTracks().forEach(t => {
        t.stop();
        console.log("📞 useWebRTC: Stopped track:", t.kind);
    });
    if (peerConnectionRef.current) {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.close();
    }

    peerConnectionRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    iceCandidateQueueRef.current = [];
    remoteDescriptionSetRef.current = false;
    isInitializedRef.current = false;

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setConnectionState("closed");
    console.log("📞 useWebRTC: Cleanup complete");
}, []);

const initialize = useCallback(async () => {
    if (isInitializedRef.current) {
        console.log("📞 useWebRTC: Already initialized, skipping");
        return;
    }
    console.log("📞 useWebRTC: Initializing...", { callType, isInitiator, callId });
    try {
        await getLocalStream();
        await createPeerConnection();
        if (isInitiator) {
            await createOffer();
        }
        isInitializedRef.current = true;
        console.log("📞 useWebRTC: Initialization complete");
    } catch (error) {
        console.error("📞 useWebRTC: Initialization failed:", error);
        cleanup();
        throw error;
    }
}, [getLocalStream, createPeerConnection, createOffer, isInitiator, callType, callId, cleanup]);
  const isWebRTCSupported = useCallback(() => {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      (window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection)
    );
  }, []);

  return {
    isConnected,
    connectionState,
    localStream,      // ✅ now state, not ref snapshot
    remoteStream,     // ✅ now state, not ref snapshot
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
    peerConnectionRef,
    localStreamRef,
    remoteStreamRef,
  };
};

export default useWebRTC;