import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { useSocket } from "../../../context/SocketContext"; // adjust path

const BackendAudioCapture = forwardRef(({ userId, mode = "hybrid", onChunk }, ref) => {
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const sessionIdRef = useRef(Date.now().toString()); // unique session per start
  const { socket } = useSocket(); // ✅ your Socket.IO connection

  // -----------------------------
  // Listen for server transcript chunks
  // -----------------------------
  useEffect(() => {
    if (!socket) {
      console.warn("⚠️ Socket not ready yet");
      return;
    }

    const handleChunk = (data) => {
      console.log("⬅ Received chunk from server:", data);
      if (data.sessionId === sessionIdRef.current && onChunk) {
        onChunk(data.text);
      }
    };

    socket.on("transcriptChunk", handleChunk);

    return () => {
      socket.off("transcriptChunk", handleChunk);
    };
  }, [socket, onChunk]);

  // -----------------------------
  // Start backend capture
  // -----------------------------
  const start = async () => {
    console.log("🟢 Backend start called, mode:", mode, "sessionId:", sessionIdRef.current);

    if (!socket || !socket.connected) {
      console.warn("⚠️ Socket not connected. Cannot start backend capture.");
      return;
    }

    if (mediaRecorderRef.current) {
      console.warn("⚠️ MediaRecorder already running");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      console.log("🎧 Microphone stream obtained:", stream);

      // Notify server to start session
      socket.emit("startSpeech", {
        userId,
        sessionId: sessionIdRef.current,
        mode,
      });
      console.log("📡 startSpeech emitted to server");

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      recorder.onstart = () => console.log("🟢 MediaRecorder started recording");
      recorder.onstop = () => console.log("🛑 MediaRecorder stopped");

      recorder.ondataavailable = async (e) => {
        if (!e.data || e.data.size === 0) return;

        const buffer = await e.data.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

        console.log("📤 Sending audio chunk to server (first 20 chars):", base64.slice(0, 20) + "...");
        socket.emit("audioChunk", {
          audio: base64,
          userId,
          sessionId: sessionIdRef.current,
        });
      };

      recorder.onerror = (e) => console.error("❌ MediaRecorder error:", e);

      recorder.start(250); // send small chunks continuously
      mediaRecorderRef.current = recorder;

      console.log("🎙️ Backend audio capture fully started");
    } catch (err) {
      console.error("❌ MediaRecorder exception:", err);
    }
  };

  // -----------------------------
  // Stop backend capture
  // -----------------------------
  const stop = () => {
    console.log("🛑 Backend stop called");

    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("⚠️ Error stopping MediaRecorder:", e);
      }
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      console.log("🎧 Microphone tracks stopped");
    }

    if (socket && socket.connected) {
      socket.emit("endSpeech", {
        userId,
        sessionId: sessionIdRef.current,
      });
      console.log("📡 endSpeech emitted to server");
    }
  };

  // -----------------------------
  // Expose API to parent
  // -----------------------------
  useImperativeHandle(ref, () => ({
    start,
    stop,
  }));

  // -----------------------------
  // Debug socket connection
  // -----------------------------
  useEffect(() => {
    if (!socket) return;
    console.log("✅ Socket status:", socket.connected ? "connected" : "disconnected");

    const handleConnect = () => console.log("✅ Socket connected");
    const handleDisconnect = () => console.log("⚠️ Socket disconnected");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  return null; // no UI
});

export default BackendAudioCapture;
