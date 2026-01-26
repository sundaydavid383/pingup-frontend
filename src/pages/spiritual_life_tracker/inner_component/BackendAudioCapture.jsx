import { forwardRef, useImperativeHandle, useRef } from "react";
import axiosBase from "../../../utils/axiosBase";

const MAX_RECORD_MS = 5000;
const TARGET_SAMPLE_RATE = 16000;

const BackendAudioCapture = forwardRef(({ userId, onResult }, ref) => {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const stopTimerRef = useRef(null);

const start = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const recorder = new MediaRecorder(stream);
  mediaRecorderRef.current = recorder;
  chunksRef.current = [];

  let stopped = false; // ✅ ensure onstop only runs once

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunksRef.current.push(e.data);
  };

  recorder.onstop = async () => {
    if (stopped) return;
    stopped = true;

    // Stop mic immediately
    stream.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    chunksRef.current = [];

    // Convert + send async (doesn't block UI)
    const wavBuffer = await blobToWav(blob);
    const base64Audio = arrayBufferToBase64(wavBuffer);

    await sendToBackend(base64Audio);
  };

  recorder.start();

  // ⏱ HARD STOP at 5 seconds
  stopTimerRef.current = setTimeout(() => {
    if (recorder.state !== "inactive") recorder.stop();
  }, MAX_RECORD_MS);

  console.log("🎙 Recording started (5s max)");
};

/* -----------------------------
   Manual stop
----------------------------- */
const stop = () => {
  // ✅ clear the auto-stop timer
  if (stopTimerRef.current) {
    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
  }

  if (mediaRecorderRef.current?.state === "recording") {
    mediaRecorderRef.current.stop();
  }
};


  useImperativeHandle(ref, () => ({ start, stop }));

  return null;

  /* =============================
     Helpers
  ============================= */

  async function sendToBackend(base64Audio) {
    const res = await axiosBase.post("/api/stt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        audio: base64Audio,
        format: "wav",
        sampleRate: TARGET_SAMPLE_RATE,
      }),
    });

    const data = await res.json();
    if (onResult) onResult(data);
  }
});

/* =============================
   AUDIO CONVERSION
============================= */

async function blobToWav(blob) {
  const arrayBuffer = await blob.arrayBuffer();

  const audioCtx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const raw = audioBuffer.getChannelData(0); // mono
  const pcm16 = new Int16Array(raw.length);

  for (let i = 0; i < raw.length; i++) {
    const s = Math.max(-1, Math.min(1, raw[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return encodeWav(pcm16, TARGET_SAMPLE_RATE);
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  write(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(view, 8, "WAVE");
  write(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset, samples[i], true);
    offset += 2;
  }

  return buffer;
}

function write(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;

  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk));
  }

  return btoa(binary);
}

export default BackendAudioCapture;
