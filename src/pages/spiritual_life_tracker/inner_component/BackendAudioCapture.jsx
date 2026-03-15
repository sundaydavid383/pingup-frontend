import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import axiosBase from "../../../utils/axiosBase";
import { useTTS } from "../../../context/TTSContext";

const MAX_RECORD_MS = 12000;           // 12 seconds max
const SILENCE_THRESHOLD = 0.01;
const SILENCE_DURATION = 2000;         // ← 2 seconds pause (exactly what you asked for)
const TARGET_SAMPLE_RATE = 16000;
const MIN_AUDIO_LENGTH_MS = 300;

const BackendAudioCapture = forwardRef(({ userId, onResult, toggleListening, mode = "vosk" }, ref) => {
  const { shouldBlockVoice, startProcessing, stopProcessing } = useTTS();
  const apiKey = import.meta.env.VITE_LEMONFOX_API;
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const stopTimerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const animationIdRef = useRef(null);
  const sessionIdRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);
  const stoppingRef = useRef(false);
  const conversionAudioCtxRef = useRef(null);

  // ====================== NON-PROGRAMMER LOGS ======================
  console.log("🎙 BackendAudioCapture LOADED - Ready for Lemonfox");

  const canStart = () => {
    if (shouldBlockVoice) {
      console.log("🔹 BLOCKED: TTS or processing is running - cannot start mic");
      return false;
    }
    return true;
  };

  const recorderOnStopCleanup = (stream) => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    isRecordingRef.current = false;
  };

  // ====================== LEMONFOX SPECIFIC ======================
  const processLemonfoxAudio = async (blob, onResult, apiKey, stopProcessing) => {
    console.log("🚀 [LEMONFOX] Step 1: Sending audio to Lemonfox API for transcription...");

    try {
      const audioFile = new File([blob], "audio.webm", { type: "audio/webm" });
      
      const body = new FormData();
      body.append("file", audioFile);
      body.append("language", "english");
      body.append("response_format", "json");

      const response = await fetch("https://api.lemonfox.ai/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}` },
        body
      });

      if (!response.ok) throw new Error(`Lemonfox error ${response.status}`);

      const data = await response.json();
      const transcript = data.text || "";

      console.log("✅ [LEMONFOX] Step 2: Transcript received →", transcript);
      console.log("🔥 [LEMONFOX] Step 3: NOW triggering verse search IMMEDIATELY");

      if (onResult) onResult({ transcript });

    } catch (err) {
      console.error("❌ Lemonfox API failed:", err);
      if (onResult) onResult({ transcript: "" });
    } finally {
      stopProcessing();
    }
  };

  const processAndSendAudio = async (chunks) => {
    if (chunks.length === 0) return;

    const blob = new Blob(chunks, { type: "audio/webm" });
    if (blob.size < 1000) {
      console.warn("🔹 Audio too short - skipping");
      return;
    }

    startProcessing();
    
    console.log("📤 [LEMONFOX] Sending full audio chunk to backend...");

    if (mode === "lemonfox" && apiKey) {
      await processLemonfoxAudio(blob, onResult, apiKey, stopProcessing);
      return;
    }

    // (vosk/hybrid code unchanged - we only care about lemonfox)
  };

  // ====================== SILENCE DETECTION (2 seconds) ======================
  const stopRecording = (shouldSendAudio = true) => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;

    console.log("⏹️ [IMPORTANT] 2-second silence detected!");
    console.log("🎙 MIC IS NOW BEING TURNED OFF");
    console.log("📨 Audio will be sent to Lemonfox right after this...");

    const recorder = mediaRecorderRef.current;
    const stream = streamRef.current;

    if (recorder && recorder.state === "recording") {
      const finalChunks = [...chunksRef.current];
      recorder.stop();
      
      if (shouldSendAudio && finalChunks.length > 0) {
        processAndSendAudio(finalChunks);   // ← async transcription starts
      }
    }

    recorderOnStopCleanup(stream);
    stoppingRef.current = false;

    if (toggleListening) {
      console.log("🔄 Calling toggleListening() → VoiceInput will now stop");
      toggleListening();
    }
  };

  const start = async () => {
    if (!canStart()) {
      if (toggleListening) toggleListening();
      return;
    }

    console.log("🎙 [LEMONFOX MODE] STARTING microphone...");
    sessionIdRef.current = "session-" + Date.now();
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = recorder;
      isRecordingRef.current = true;

      // Silence detection setup
      audioCtxRef.current = new AudioContext({ sampleRate: 48000 });
      sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      sourceRef.current.connect(analyserRef.current);
      dataArrayRef.current = new Float32Array(analyserRef.current.fftSize);

      const checkSilence = () => {
        if (!isRecordingRef.current) return;

        analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) sum += dataArrayRef.current[i] ** 2;
        const rms = Math.sqrt(sum / dataArrayRef.current.length);
        const volume = Math.max(rms, Math.max(...dataArrayRef.current.map(Math.abs)) * 0.7);

        if (volume < SILENCE_THRESHOLD) {
          if (!silenceTimerRef.current) {
            console.log("⏳ Silence started... waiting 2 seconds");
            silenceTimerRef.current = setTimeout(() => {
              stopRecording(true);   // ← This is where everything happens
            }, SILENCE_DURATION);
          }
        } else {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }

        animationIdRef.current = requestAnimationFrame(checkSilence);
      };

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => console.log("✅ Recorder stopped cleanly");

      recorder.start(50); // 50ms chunks = very responsive
      animationIdRef.current = requestAnimationFrame(checkSilence);

      stopTimerRef.current = setTimeout(() => {
        console.log("⏰ Max 12s reached");
        stopRecording(true);
      }, MAX_RECORD_MS);

      console.log("✅ Recording STARTED - Listening for 2-second pause...");

    } catch (err) {
      console.error("❌ Could not start mic:", err);
      if (toggleListening) toggleListening();
    }
  };

  const stop = () => {
    console.log("🛑 Manual stop called");
    stopRecording(true);
  };

  // Auto-stop if TTS starts
  useEffect(() => {
    if (shouldBlockVoice && isRecordingRef.current) {
      console.log("🔹 TTS started → stopping recording");
      stopRecording(true);
    }
  }, [shouldBlockVoice]);

  useImperativeHandle(ref, () => ({ start, stop }));

  return null;
});

export default BackendAudioCapture;