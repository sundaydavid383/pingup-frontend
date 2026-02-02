import { forwardRef, useImperativeHandle, useRef } from "react";
import axiosBase from "../../../utils/axiosBase";

const MAX_RECORD_MS = 6000; // 5 seconds max
const SILENCE_THRESHOLD = 0.015; // instead of 0.003
const SILENCE_DURATION = 1500; // 1.5 seconds of silence
const TARGET_SAMPLE_RATE = 16000;

const BackendAudioCapture = forwardRef(({ userId, onResult, toggleListening }, ref) => {
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



  const recorderOnStopCleanup = (stream) => {
  // Stop mic tracks
  stream.getTracks().forEach((t) => t.stop());
  // Stop AudioContext
  audioCtxRef.current?.close();
  audioCtxRef.current = null;
  // Cancel animation
  cancelAnimationFrame(animationIdRef.current);
  animationIdRef.current = null;
  // Clear timers
  if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
  if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  stopTimerRef.current = null;
  silenceTimerRef.current = null;
};


const start = async () => {
  console.log("🔹 Starting recording process");
  sessionIdRef.current = "session-" + Date.now();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  console.log("🔹 Microphone access granted");

  const recorder = new MediaRecorder(stream, {
    mimeType: "audio/webm;codecs=opus"
  });
  mediaRecorderRef.current = recorder;
  chunksRef.current = [];

  let stopped = false;

  // Setup Web Audio API for silence detection
  audioCtxRef.current = new AudioContext({ sampleRate: 48000 });
  sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
  analyserRef.current = audioCtxRef.current.createAnalyser();
  analyserRef.current.fftSize = 2048;
  dataArrayRef.current = new Float32Array(analyserRef.current.fftSize);
  sourceRef.current.connect(analyserRef.current);

  const checkSilence = () => {
    analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
    const max = Math.max(...dataArrayRef.current.map(Math.abs));

  if (max < SILENCE_THRESHOLD) {
  if (!silenceTimerRef.current) {
    silenceTimerRef.current = setTimeout(() => {
      console.log("🔹 Silence detected, stopping recorder immediately");
      if (recorder.state !== "inactive") recorder.stop();
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

  // Recorder events
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunksRef.current.push(e.data);
  };

  recorder.onstart = () => console.log("🔹 MediaRecorder started");
recorder.onstop = async () => {
  console.log("🔹 MediaRecorder stopped");
  if (stopped) return;
  stopped = true;

  recorderOnStopCleanup(stream);

  if (chunksRef.current.length === 0) {
    console.warn("❌ No audio chunks recorded");
    if(toggleListening) toggleListening(); // notify parent immediately
    return;
  }

  const blob = new Blob(chunksRef.current, { type: "audio/webm" });
  const wavBuffer = await blobToWav(blob);
  const base64Audio = arrayBufferToBase64(wavBuffer);

  await sendToBackend(base64Audio);

  // 🔹 Notify parent after each burst
  if(toggleListening) toggleListening();
};


  // Start recording with a small timeslice for frequent ondataavailable events
  recorder.start(100); // 100ms chunk intervals
  console.log("🎙 Recording started (max 10s, auto silence detection)");

  animationIdRef.current = requestAnimationFrame(checkSilence);

  // Max stop timer
  stopTimerRef.current = setTimeout(() => {
    console.log("🔹 Max duration reached, stopping recorder");
    if (recorder.state !== "inactive") recorder.stop();
    if (toggleListening) toggleListening();
  }, MAX_RECORD_MS);
};


  const stop = () => {
    console.log("🔹 Manual stop triggered");
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  };

  useImperativeHandle(ref, () => ({ start, stop }));

  return null;

  /* =============================
     Helpers
  ============================= */

async function sendToBackend(base64Audio) {
  console.log("🔹 Sending audio to backend", {
    userId,
    sessionId: sessionIdRef.current,
  });

  try {
    const res = await axiosBase.post("/api/stt", {
      userId,
      sessionId: sessionIdRef.current,
      audio: base64Audio,
      format: "wav",
      sampleRate: TARGET_SAMPLE_RATE,
      mode: "vosk",
    });

    console.log("🔹 Backend response received:", res.data);
    if (onResult) onResult(res.data);
  } catch (err) {
    console.error("❌ Error sending audio to backend:", err);
    if (onResult) onResult({ transcript: "" });
  }
}

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


function write(view, offset, str) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function arrayBufferToBase64(buffer) {
  console.log("🔹 Converting ArrayBuffer to Base64");
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.slice(i, i + chunk));
  return btoa(binary);
}

export default BackendAudioCapture;
