import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import axiosBase from "../../../utils/axiosBase";
import { useTTS } from "../../../context/TTSContext";

const MAX_RECORD_MS = 6000; // 6 seconds max
const SILENCE_THRESHOLD = 0.01; // Optimized threshold for speech detection
const SILENCE_DURATION = 1200; // 1.2 seconds of silence (faster response)
const TARGET_SAMPLE_RATE = 16000;
const MIN_AUDIO_LENGTH_MS = 300; // Minimum audio to send (prevents tiny clips)

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
  const lastAudioTimeRef = useRef(Date.now());

  // Check if TTS is blocking before starting
  const canStart = () => {
    if (shouldBlockVoice) {
      console.log("🔹 Recording blocked - TTS or processing active");
      return false;
    }
    return true;
  };

  const recorderOnStopCleanup = (stream) => {
    // Stop mic tracks
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    // Stop AudioContext
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    // Cancel animation
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    // Clear timers
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    isRecordingRef.current = false;
  };

  const processAndSendAudio = async (chunks) => {
    if (chunks.length === 0) return;

    const blob = new Blob(chunks, { type: "audio/webm" });
    
    // Check minimum audio length
    if (blob.size < 1000) {
      console.warn("🔹 Audio too short, skipping");
      return;
    }

    startProcessing();
    
    try {
      // If mode is lemonfox, use Lemonfox API directly
      if (mode === "lemonfox" && apiKey) {
        await processLemonfoxAudio(blob, onResult, apiKey, stopProcessing);
        return;
      }

      // Otherwise use backend (vosk/hybrid)
      const wavBuffer = await blobToWav(blob);
      const base64Audio = arrayBufferToBase64(wavBuffer);

      console.log("🔹 Sending audio to backend", {
        userId,
        sessionId: sessionIdRef.current,
        audioSize: base64Audio.length,
      });

      const res = await axiosBase.post("/api/stt", {
        userId,
        sessionId: sessionIdRef.current,
        audio: base64Audio,
        format: "wav",
        sampleRate: TARGET_SAMPLE_RATE,
        mode: mode,
      });

      console.log("🔹 Backend response received:", res.data);
      if (onResult) onResult(res.data);
    } catch (err) {
      console.error("❌ Error sending audio to backend:", err);
      if (onResult) onResult({ transcript: "" });
    } finally {
      stopProcessing();
    }
  };

  const stopRecording = (shouldSendAudio = true) => {
    console.log("🔹 Stopping recording, shouldSend:", shouldSendAudio);
    
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    const stream = streamRef.current;

    if (recorder && recorder.state === "recording") {
      // Collect final chunks before stopping
      const finalChunks = [...chunksRef.current];
      
      recorder.stop();
      
      if (shouldSendAudio && finalChunks.length > 0) {
        processAndSendAudio(finalChunks);
      }
    }

    recorderOnStopCleanup(stream);
    
    if (toggleListening) {
      toggleListening();
    }
  };

  const start = async () => {
    // Check if TTS is blocking
    if (!canStart()) {
      if (toggleListening) toggleListening();
      return;
    }

    console.log("🔹 Starting recording process");
    sessionIdRef.current = "session-" + Date.now();
    chunksRef.current = [];
    lastAudioTimeRef.current = Date.now();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;
      console.log("🔹 Microphone access granted");

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus"
      });
      mediaRecorderRef.current = recorder;
      isRecordingRef.current = true;

      // Setup Web Audio API for silence detection
      audioCtxRef.current = new AudioContext({ sampleRate: 48000 });
      sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      dataArrayRef.current = new Float32Array(analyserRef.current.fftSize);
      sourceRef.current.connect(analyserRef.current);

      // Silence detection with improved algorithm
      const checkSilence = () => {
        if (!isRecordingRef.current) return;
        
        analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
        
        // Calculate RMS for more accurate volume detection
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i] * dataArrayRef.current[i];
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length);
        
        // Also check peak
        const max = Math.max(...dataArrayRef.current.map(Math.abs));

        // Use both RMS and peak for better detection
        const volume = Math.max(rms, max * 0.7);

        if (volume < SILENCE_THRESHOLD) {
          if (!silenceTimerRef.current) {
            // Start silence timer
            silenceTimerRef.current = setTimeout(() => {
              console.log("🔹 Silence detected, stopping recorder");
              stopRecording(true);
            }, SILENCE_DURATION);
          }
        } else {
          // Audio detected, clear silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          lastAudioTimeRef.current = Date.now();
        }

        animationIdRef.current = requestAnimationFrame(checkSilence);
      };

      // Recorder events
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstart = () => console.log("🔹 MediaRecorder started");
      
      recorder.onstop = async () => {
        console.log("🔹 MediaRecorder stopped");
        if (!isRecordingRef.current) return;
        isRecordingRef.current = false;
      };

      // Start recording with frequent chunks for low latency
      recorder.start(50); // 50ms chunk intervals for faster response
      console.log("🎙 Recording started (max 6s, auto silence detection)");

      animationIdRef.current = requestAnimationFrame(checkSilence);

      // Max duration timer
      stopTimerRef.current = setTimeout(() => {
        console.log("🔹 Max duration reached");
        stopRecording(true);
      }, MAX_RECORD_MS);

    } catch (err) {
      console.error("❌ Error starting recording:", err);
      if (toggleListening) toggleListening();
    }
  };

  const stop = () => {
    console.log("🔹 Manual stop triggered");
    stopRecording(true);
  };

  // Monitor TTS state - auto-stop if TTS starts
  useEffect(() => {
    if (shouldBlockVoice && isRecordingRef.current) {
      console.log("🔹 TTS/Processing started, stopping recording");
      stopRecording(true);
    }
  }, [shouldBlockVoice]);

  useImperativeHandle(ref, () => ({ 
    start, 
    stop,
    isRecording: () => isRecordingRef.current,
  }));

  return null;
});

// =============================
// Convert blob to 16kHz mono PCM16 WAV
// =============================
async function blobToWav(blob) {
  console.log("🔹 Converting blob to WAV");

  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Resample to 16 kHz
  const targetSampleRate = 16000;
  const numberOfChannels = 1;

  const offlineCtx = new OfflineAudioContext(
    numberOfChannels,
    Math.ceil(audioBuffer.duration * targetSampleRate),
    targetSampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();

  // Take first channel (mono)
  const channelData = renderedBuffer.getChannelData(0);

  // Convert float32 -> PCM16
  const pcm16 = new Int16Array(channelData.length);
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  console.log("🔹 WAV PCM16 prepared, length:", pcm16.length);

  // Encode WAV
  return encodeWav(pcm16, targetSampleRate, numberOfChannels);
}

function encodeWav(samples, sampleRate, numChannels = 1) {
  console.log("🔹 Encoding WAV");
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;

  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, "WAVE");

  // fmt subchunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM header size
  view.setUint16(20, 1, true); // audio format 1 = PCM
  view.setUint16(22, numChannels, true); // channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, byteRate, true); // byte rate
  view.setUint16(32, blockAlign, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data subchunk
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);

  // Write PCM16 samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }

  console.log("🔹 WAV encoding finished");
  return buffer;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer) {
  console.log("🔹 Converting ArrayBuffer to Base64");
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk));
  }
  return btoa(binary);
}

// =============================
// Lemonfox AI STT API Integration
// =============================
async function processLemonfoxAudio(blob, onResult, apiKey, stopProcessing) {
  console.log("🔹 Processing audio with Lemonfox API");
  
  try {
    // Convert blob to File object for FormData
    const audioFile = new File([blob], "audio.webm", { type: "audio/webm" });
    
    const body = new FormData();
    body.append("file", audioFile);
    body.append("language", "english");
    body.append("response_format", "json");
    
    const response = await fetch("https://api.lemonfox.ai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: body
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Lemonfox API error:", response.status, errorText);
      if (onResult) onResult({ transcript: "" });
      return;
    }
    
    const data = await response.json();
    console.log("🔹 Lemonfox response:", data);
    
    const transcript = data.text || "";
    if (onResult) {
      onResult({ transcript });
    }
  } catch (err) {
    console.error("❌ Error with Lemonfox API:", err);
    if (onResult) onResult({ transcript: "" });
  }
}

export default BackendAudioCapture;
