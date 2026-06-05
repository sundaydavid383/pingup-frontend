import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { X, Image, Video as VideoIcon, Trash2, Headphones, Youtube, Link, AlertCircle } from "lucide-react";
import CustomAlert from "../component/shared/CustomAlert";
import location from "../utils/location";
import BackButton from "../component/shared/BackButton";
import ProfileAvatar from "../component/shared/ProfileAvatar";
import AudioMessage from "../component/shared/AudioMessage";
import { useNavigate } from "react-router-dom";

/* ─── Scoped styles ─────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&display=swap');

  .cp-page {
    min-height: 100svh;
    background: linear-gradient(160deg, #f0f4ff 0%, #ffffff 55%, #f8f0ff 100%);
    padding: 24px 16px 48px;
    position: relative;
    overflow-x: hidden;
  }

  /* Ambient mesh blobs */
  .cp-page::before, .cp-page::after {
    content: '';
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    filter: blur(80px);
    opacity: 0.35;
  }
  .cp-page::before {
    width: 500px; height: 500px;
    top: -120px; left: -120px;
    background: radial-gradient(circle, rgba(59,92,203,0.28) 0%, transparent 70%);
  }
  .cp-page::after {
    width: 400px; height: 400px;
    bottom: 0; right: -80px;
    background: radial-gradient(circle, rgba(131,109,240,0.22) 0%, transparent 70%);
  }

  .cp-inner {
    max-width: 680px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  /* Page header */
  .cp-head {
    margin-bottom: 24px;
    padding-top: 8px;
  }
  .cp-head-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--primary-color);
    background: rgba(59,92,203,0.08);
    border: 1px solid rgba(59,92,203,0.16);
    padding: 3px 10px;
    border-radius: 99px;
    margin-bottom: 10px;
  }
  .cp-head-title {
    font-family: 'Sora', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--secondary);
    letter-spacing: -0.025em;
    line-height: 1.15;
    margin: 0 0 6px;
  }
  .cp-head-sub {
    font-size: 13.5px;
    color: var(--text-muted);
    margin: 0;
  }

  /* Card */
  .cp-card {
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(59,92,203,0.1);
    box-shadow:
      0 1px 3px rgba(59,92,203,0.06),
      0 12px 40px rgba(59,92,203,0.09),
      0 32px 64px rgba(5,13,58,0.06);
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    overflow: hidden;
  }

  /* Card inner top glow */
  .cp-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(59,92,203,0.25) 40%, rgba(131,109,240,0.2) 70%, transparent 100%);
    pointer-events: none;
  }

  /* User row */
  .cp-user-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .cp-user-info h2 {
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--secondary);
    margin: 0 0 2px;
    letter-spacing: -0.01em;
  }
  .cp-user-info p {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0;
  }

  /* Composer area */
  .cp-composer {
    position: relative;
  }
  .cp-textarea {
    width: 100%;
    resize: none;
    outline: none;
    border: none;
    background: transparent;
    font-size: 15px;
    font-family: inherit;
    color: var(--text-dark);
    line-height: 1.65;
    transition: all 0.2s ease;
    min-height: 90px;
    max-height: 49vh;
    overflow-y: auto;
    display: block;
    padding: 0;
  }
  .cp-textarea::placeholder {
    color: #b0bcd6;
    font-style: italic;
  }
  .cp-textarea:disabled {
    opacity: 0.5;
  }

  /* Divider line under textarea */
  .cp-composer-rule {
    height: 1.5px;
    background: linear-gradient(90deg, var(--primary-color) 0%, rgba(59,92,203,0.15) 60%, transparent 100%);
    border-radius: 99px;
    margin-top: 8px;
    transition: opacity 0.2s;
  }
  .cp-char-count {
    font-size: 11.5px;
    color: var(--text-secondary);
    text-align: right;
    margin-top: 6px;
    font-variant-numeric: tabular-nums;
  }
  .cp-char-count.near-limit {
    color: var(--warning);
    font-weight: 600;
  }
  .cp-char-count.at-limit {
    color: var(--danger);
    font-weight: 700;
  }

  /* Visibility row */
  .cp-visibility-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .cp-visibility-label {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .cp-visibility-select {
    appearance: none;
    background: var(--color-6);
    border: 1.5px solid rgba(59,92,203,0.18);
    border-radius: 8px;
    padding: 6px 28px 6px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-color);
    cursor: pointer;
    outline: none;
    transition: all 0.2s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%233b5ccb' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    font-family: inherit;
  }
  .cp-visibility-select:hover, .cp-visibility-select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59,92,203,0.1);
  }

  /* YouTube section */
  .cp-yt-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cp-yt-label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-dark);
  }
  .cp-yt-label svg { color: #ff0000; }
  .cp-yt-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    border-radius: 11px;
    border: 1.5px solid var(--input-border);
    background: var(--off-white);
    transition: all 0.2s ease;
    min-height: 42px;
  }
  .cp-yt-input-wrap.has-preview {
    border-color: var(--primary-color);
    background: var(--color-6);
    box-shadow: 0 0 0 3px rgba(59,92,203,0.08);
  }
  .cp-yt-input-wrap.has-error {
    border-color: var(--error);
    background: rgba(239,68,68,0.04);
  }
  .cp-yt-input-wrap svg { color: var(--text-secondary); flex-shrink: 0; }
  .cp-yt-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    font-family: inherit;
    color: var(--text-dark);
    padding: 10px 0;
  }
  .cp-yt-input::placeholder { color: #b0bcd6; }
  .cp-yt-remove {
    width: 26px; height: 26px;
    border-radius: 50%;
    background: rgba(239,68,68,0.1);
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--danger);
    transition: all 0.18s;
    flex-shrink: 0;
  }
  .cp-yt-remove:hover { background: rgba(239,68,68,0.2); transform: scale(1.1); }
  .cp-yt-error {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--error);
    padding: 0 2px;
  }
  .cp-yt-preview {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(59,92,203,0.2);
    box-shadow: 0 4px 16px rgba(59,92,203,0.1);
  }
  .cp-yt-preview-iframe-wrap {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
  }
  .cp-yt-preview-iframe-wrap iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
  }
  .cp-yt-preview-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--color-6);
    border-top: 1px solid rgba(59,92,203,0.1);
  }
  .cp-yt-preview-meta span {
    font-size: 11.5px;
    color: var(--text-muted);
  }
  .cp-yt-preview-meta span:last-child {
    color: var(--primary-color);
    font-weight: 600;
  }

  /* Media thumbnails */
  .cp-media-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .cp-thumb {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    border: 1.5px solid rgba(59,92,203,0.1);
    background: var(--off-white);
    flex-shrink: 0;
  }
  .cp-thumb-img {
    width: 90px; height: 90px;
    object-fit: cover;
    display: block;
  }
  .cp-thumb-vid {
    width: 128px; height: 80px;
    object-fit: contain;
    display: block;
  }
  .cp-thumb-remove {
    position: absolute;
    top: 5px; right: 5px;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: rgba(5,13,58,0.7);
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    backdrop-filter: blur(4px);
    transition: all 0.18s;
    z-index: 2;
  }
  .cp-thumb-remove:hover { background: var(--danger); transform: scale(1.1); }

  /* Toolbar & footer */
  .cp-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid rgba(59,92,203,0.1);
  }
  .cp-tools {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  /* Tool button base */
  .cp-tool-btn {
    width: 40px; height: 40px;
    border-radius: 10px;
    border: 1.5px solid rgba(59,92,203,0.14);
    background: var(--off-white);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.2s cubic-bezier(.4,0,.2,1);
    position: relative;
    flex-shrink: 0;
  }
  .cp-tool-btn:hover {
    border-color: var(--primary-color);
    background: var(--color-6);
    color: var(--primary-color);
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(59,92,203,0.14);
  }
  .cp-tool-btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
    box-shadow: 0 4px 12px rgba(59,92,203,0.3);
  }
  .cp-tool-btn.recording {
    background: var(--danger);
    border-color: var(--danger);
    color: #fff;
    animation: cp-pulse 1.2s ease-in-out infinite;
    box-shadow: 0 0 0 0 rgba(220,38,38,0.4);
  }
  @keyframes cp-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.35); }
    50% { box-shadow: 0 0 0 6px rgba(220,38,38,0); }
  }
  .cp-tool-btn.rec-dot::after {
    content: '';
    position: absolute;
    top: 6px; right: 6px;
    width: 7px; height: 7px;
    background: var(--danger);
    border-radius: 50%;
    animation: cp-blink 1s step-start infinite;
  }
  @keyframes cp-blink {
    0%,100%{opacity:1} 50%{opacity:0}
  }

  .cp-tool-divider {
    width: 1px; height: 24px;
    background: rgba(59,92,203,0.12);
    margin: 0 2px;
    flex-shrink: 0;
  }

  /* Audio preview inline */
  .cp-audio-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--color-6);
    border: 1.5px solid rgba(59,92,203,0.15);
    border-radius: 10px;
    padding: 6px 10px;
    margin-top: 4px;
  }
  .cp-audio-remove {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--danger);
    display: flex; align-items: center;
    transition: all 0.18s;
    flex-shrink: 0;
  }
  .cp-audio-remove:hover { transform: scale(1.15); }

  /* Action buttons */
  .cp-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .cp-cancel-btn {
    padding: 9px 18px;
    background: rgba(220,38,38,0.08);
    color: var(--danger);
    border: 1.5px solid rgba(220,38,38,0.2);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .cp-cancel-btn:hover {
    background: rgba(220,38,38,0.14);
    border-color: var(--danger);
  }
  .cp-publish-btn {
    padding: 9px 24px;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary) 100%);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 700;
    font-family: 'Sora', sans-serif;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(.4,0,.2,1);
    white-space: nowrap;
    letter-spacing: -0.01em;
    box-shadow: 0 4px 14px rgba(59,92,203,0.3);
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .cp-publish-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--primary) 0%, #1e3a8a 100%);
    box-shadow: 0 6px 20px rgba(59,92,203,0.4);
    transform: translateY(-1px);
  }
  .cp-publish-btn:active:not(:disabled) { transform: translateY(0); }
  .cp-publish-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
  .cp-publish-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: rgba(255,255,255,0.6);
    animation: cp-blink 1s step-start infinite;
  }

  /* Upload progress */
  .cp-progress-wrap {
    width: 100%;
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cp-progress-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-muted);
  }
  .cp-progress-label span:last-child {
    font-weight: 700;
    color: var(--primary-color);
    font-variant-numeric: tabular-nums;
  }
  .cp-progress-track {
    width: 100%;
    height: 5px;
    background: var(--color-6);
    border-radius: 99px;
    overflow: hidden;
  }
  .cp-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color) 0%, var(--hover-dark) 100%);
    border-radius: 99px;
    transition: width 0.3s ease;
  }
  .cp-progress-fill.processing {
    width: 100% !important;
    animation: cp-shimmer 1.4s linear infinite;
    background-size: 200% 100%;
    background-image: linear-gradient(90deg, var(--primary-color) 0%, var(--hover-dark) 40%, var(--primary-color) 100%);
  }
  @keyframes cp-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Spin icon */
  .cp-spin {
    animation: cp-rotate 0.8s linear infinite;
    display: inline-block;
  }
  @keyframes cp-rotate { to { transform: rotate(360deg); } }

  /* Responsive */
  @media (max-width: 640px) {
    .cp-page { padding: 16px 12px 40px; }
    .cp-head-title { font-size: 22px; }
    .cp-card { padding: 18px 16px; gap: 16px; }
    .cp-footer { gap: 8px; }
    .cp-publish-btn { flex: 1; justify-content: center; }
  }
    /* ── Toxicity inline banner ─────────────────────────── */
.cp-tox {
  border-radius: 12px;
  border: 1.5px solid rgba(220, 38, 38, 0.18);
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(220, 38, 38, 0.03) 0%,
    rgba(246, 248, 255, 0.96) 100%
  );
  position: relative;
  box-shadow: 0 2px 12px rgba(220, 38, 38, 0.07);
}

/* Left accent stripe */
.cp-tox::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--danger) 0%, #f87171 100%);
  border-radius: 12px 0 0 12px;
  pointer-events: none;
}

/* ── Header row (always visible) ─── */
.cp-tox-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px 9px 15px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
  min-height: 42px;
}
.cp-tox-header:hover {
  background: rgba(220, 38, 38, 0.04);
}

.cp-tox-icon {
  font-size: 13px;
  flex-shrink: 0;
  line-height: 1;
}

.cp-tox-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--danger);
  font-family: 'Sora', sans-serif;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: -0.01em;
}

.cp-tox-dot {
  width: 3px; height: 3px;
  border-radius: 50%;
  background: rgba(220,38,38,0.3);
  flex-shrink: 0;
}

.cp-tox-score-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 99px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  border: 1px solid transparent;
}

.cp-tox-chips-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.cp-tox-chip-sm {
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 99px;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.18);
  color: var(--danger);
  font-family: monospace;
  white-space: nowrap;
  flex-shrink: 0;
}

.cp-tox-more-count {
  font-size: 10.5px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.cp-tox-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--primary-color);
  background: rgba(59, 92, 203, 0.07);
  border: 1px solid rgba(59, 92, 203, 0.14);
  border-radius: 7px;
  padding: 3px 9px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
}
.cp-tox-toggle-btn:hover {
  background: rgba(59, 92, 203, 0.13);
  border-color: var(--primary-color);
}

.cp-tox-chevron {
  display: inline-block;
  transition: transform 0.28s cubic-bezier(.4, 0, .2, 1);
}
.cp-tox-chevron.open {
  transform: rotate(180deg);
}

/* ── Expandable body ─── */
.cp-tox-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.32s cubic-bezier(.4, 0, .2, 1);
}
.cp-tox-body.open {
  grid-template-rows: 1fr;
}
.cp-tox-body-inner {
  overflow: hidden;
}
.cp-tox-body-content {
  padding: 12px 15px 14px;
  border-top: 1px solid rgba(220, 38, 38, 0.1);
  display: flex;
  flex-direction: column;
  gap: 11px;
}

/* Score bar */
.cp-tox-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cp-tox-bar-track {
  flex: 1;
  height: 4px;
  background: rgba(220, 38, 38, 0.1);
  border-radius: 99px;
  overflow: hidden;
}
.cp-tox-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.5s cubic-bezier(.4, 0, .2, 1);
}
.cp-tox-bar-label {
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Text preview */
.cp-tox-preview {
  background: var(--off-white);
  border: 1px solid rgba(220, 38, 38, 0.1);
  border-radius: 9px;
  padding: 9px 11px;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--text-dark);
}
.cp-tox-preview-eyebrow {
  font-size: 9.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.cp-tox-preview-eyebrow::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(220,38,38,0.1);
}

/* All chips row */
.cp-tox-all-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}
.cp-tox-chip-full {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(220, 38, 38, 0.07);
  border: 1px solid rgba(220, 38, 38, 0.18);
  color: var(--danger);
  font-size: 11.5px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 99px;
  font-family: monospace;
}
.cp-tox-chip-weight {
  font-size: 9.5px;
  opacity: 0.6;
}

/* Footer row */
.cp-tox-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 9px;
  border-top: 1px solid rgba(220, 38, 38, 0.08);
  flex-wrap: wrap;
}
.cp-tox-hint-text {
  font-size: 11.5px;
  color: var(--text-muted);
  line-height: 1.45;
  flex: 1;
  min-width: 120px;
}
.cp-tox-post-anyway {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--danger);
  background: rgba(220, 38, 38, 0.06);
  border: 1.5px solid rgba(220, 38, 38, 0.2);
  border-radius: 8px;
  padding: 5px 12px;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: all 0.17s;
  flex-shrink: 0;
}
.cp-tox-post-anyway:hover {
  background: rgba(220, 38, 38, 0.13);
  border-color: var(--danger);
  transform: translateY(-1px);
}
`;

const CreatePost = () => {
  const { user, token } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();

  const [youtubeInput, setYoutubeInput] = useState("");
  const [youtubeError, setYoutubeError] = useState("");
  const [youtubePreview, setYoutubePreview] = useState(null);
  const [youtubeType, setYoutubeType] = useState(null);
   const [toxicityExpanded, setToxicityExpanded] = useState(false);
const skipToxicityRef = useRef(false);
  const DRAFT_KEY = "createPost_draft";
  const MAX_DRAFT_IMAGE_SIZE = 2 * 1024 * 1024;

  const saveDraft = useCallback((text, imgs, vids, ytPreview, ytInput, ytType) => {
    try {
      const draft = { content: text, youtubeInput: ytInput, youtubePreview: ytPreview, youtubeType: ytType, timestamp: Date.now() };
      if (imgs.length > 0) {
        const smallImages = [];
        for (const file of imgs) {
          if (file.size <= MAX_DRAFT_IMAGE_SIZE) {
            const reader = new FileReader();
            smallImages.push({ name: file.name, size: file.size, type: file.type });
          }
        }
        draft.imageCount = imgs.length;
        draft.hasLargeImages = imgs.length > smallImages.length;
      }
      if (vids.length > 0) draft.videoCount = vids.length;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) { console.warn("Failed to save draft:", e); }
  }, []);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { console.warn("Failed to clear draft:", e); }
  }, []);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setContent(draft.content || "");
        setYoutubeInput(draft.youtubeInput || "");
        setYoutubePreview(draft.youtubePreview || null);
        setYoutubeType(draft.youtubeType || null);
      }
    } catch (e) { console.warn("Failed to restore draft:", e); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content || youtubeInput || youtubePreview) {
        saveDraft(content, images, videos, youtubePreview, youtubeInput, youtubeType);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [content, youtubeInput, youtubePreview, youtubeType, images.length, videos.length, saveDraft]);

  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [toxicityLoading, setToxicityLoading] = useState(false);
  const [toxicityWarning, setToxicityWarning] = useState(null);
  const [alert, setAlert] = useState(null);
  const abortControllerRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState("");
  const streamRef = useRef(null);

  const [audio, setAudio] = useState(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const textareaRef = useRef(null);

  const extractVideoId = (input) => {
    const urlPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of urlPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const validateYoutubeInput = (input) => {
    if (!input.trim()) return { valid: false, videoId: null, type: null };
    const iframeMatch = input.match(/<iframe[^>]*src=["']([^"']*)["'][^>]*>/i);
    if (iframeMatch) {
      const videoId = extractVideoId(iframeMatch[1]);
      if (videoId) return { valid: true, videoId, type: "iframe" };
    }
    const videoId = extractVideoId(input);
    if (videoId) return { valid: true, videoId, type: "url" };
    return { valid: false, videoId: null, type: null };
  };

  const getYoutubeEmbedUrl = (videoId) =>
    `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

  const handleYoutubeInputChange = (e) => {
    const value = e.target.value;
    setYoutubeInput(value);
    setYoutubeError("");
    if (!value.trim()) { setYoutubePreview(null); setYoutubeType(null); return; }
    const validation = validateYoutubeInput(value);
    if (validation.valid) {
      setYoutubePreview({ videoId: validation.videoId, embedUrl: getYoutubeEmbedUrl(validation.videoId) });
      setYoutubeType(validation.type);
    } else {
      setYoutubePreview(null); setYoutubeType(null);
      if (value.trim().length > 0) setYoutubeError("Invalid YouTube URL or embed code");
    }
  };

  const handleRemoveYoutube = () => {
    setYoutubeInput(""); setYoutubePreview(null); setYoutubeError(""); setYoutubeType(null);
  };

  const MAX_TEXT_LENGTH = 500;
  const MAX_IMAGES = 4;
  const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
  const MAX_VIDEOS = 1;
  const MAX_VIDEO_SIZE = 15 * 1024 * 1024;
  const MAX_VIDEO_DURATION = 1040;

  const showAlert = (message, type = "info") => setAlert({ message, type });
  
  // Words too common to flag — even if the model weights them
const IGNORE_WORDS = new Set([
  "you","are","is","he","she","they","we","i","it","a","an","the",
  "this","that","was","be","been","being","do","does","did","have",
  "has","had","will","would","could","should","may","might","shall",
  "your","my","our","his","her","its","their","guys","people","person",
  "one","all","some","any","here","there","where","what","who","how",
  "not","no","yes","just","so","very","really","like","get","go",
  "come","know","think","want","make","see","look","use","good","well"
]);

const filterBadWords = (bad_words = []) =>
  bad_words.filter(
    (w) =>
      w.weight >= 3.5 &&
      !IGNORE_WORDS.has(w.word.toLowerCase()) &&
      !w.word.includes(" ") === false ? true : w.weight >= 5
  );

const checkToxicity = async (text) => {
  if (!text || text.trim().length < 3) return { clean: true };
  try {
    setToxicityLoading(true);

    const controller = new AbortController();
    // Give the server 8 seconds — if it's cold-starting it will miss this
    // and we just let the post through silently
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await axios.post(
      "https://detoxify-7my5.onrender.com/process/",
      { text: text.trim() },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const { toxicity, score, bad_words } = res.data;
    const filtered = filterBadWords(bad_words);
    if (toxicity) return { clean: false, score, bad_words: filtered };
    return { clean: true };

  } catch (err) {
    // Timeout (AbortError), CORS failure, or network error → let post through
    if (axios.isCancel(err) || err.name === "AbortError" || err.code === "ERR_CANCELED") {
      console.warn("Toxicity check timed out — posting anyway.");
    } else {
      console.warn("Toxicity check failed, proceeding:", err);
    }
    return { clean: true };
  } finally {
    setToxicityLoading(false);
  }
};

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = window.innerHeight * 0.49;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => { autoResizeTextarea(); }, [content]);

  const handleTextChange = (e) => {
    setToxicityWarning(null);
    let value = e.target.value.replace(/\n{2,}/g, "\n").trimStart().replace(/\n+$/g, "");
    if (value.length > MAX_TEXT_LENGTH) return showAlert(`Text cannot exceed ${MAX_TEXT_LENGTH} characters.`, "warning");
    setContent(value);
    autoResizeTextarea();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\n{2,}/g, "\n").trim();
    setContent((prev) => {
      const cleaned = `${prev}\n${text}`.replace(/\n{2,}/g, "\n").trimStart();
      return cleaned.slice(0, MAX_TEXT_LENGTH);
    });
  };

  const handleImageUpload = (e) => {
    if (videos.length > 0) return showAlert("You cannot upload images while a video is selected. Delete the video first.", "warning");
    if (youtubePreview) return showAlert("You cannot upload images while a YouTube video is selected. Remove the YouTube video first.", "warning");
    const files = Array.from(e.target.files);
    if (images.length + files.length > MAX_IMAGES) return showAlert(`You can only upload up to ${MAX_IMAGES} images.`, "warning");
    for (const file of files) if (file.size > MAX_IMAGE_SIZE) return showAlert(`Image ${file.name} exceeds 15MB.`, "warning");
    setImages([...images, ...files]);
  };

  const handleVideoUpload = (e) => {
    if (images.length > 0) return showAlert("You cannot upload a video while images are selected. Delete the images first.", "warning");
    if (youtubePreview) return showAlert("You cannot upload a video while a YouTube video is selected. Remove the YouTube video first.", "warning");
    const files = Array.from(e.target.files);
    if (videos.length + files.length > MAX_VIDEOS) return showAlert("Only 1 video allowed. Delete the existing one using the cancel button.", "warning");
    files.forEach((file) => {
      if (file.size > MAX_VIDEO_SIZE) return showAlert(`Video ${file.name} exceeds 15MB.`, "warning");
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) showAlert(`Video ${file.name} exceeds ${MAX_VIDEO_DURATION} seconds.`, "warning");
        else setVideos((prev) => [...prev, file]);
      };
    });
  };

  const handleSubmit = async () => {
      if (!content && images.length === 0 && videos.length === 0 && !audio && !youtubePreview)
    return showAlert("Please add content, images, videos, audio, or a YouTube video", "warning");

 if (content && content.trim().length > 2 && !skipToxicityRef.current) {
  const result = await checkToxicity(content);
  if (!result.clean) {
    setToxicityWarning({ score: result.score, bad_words: result.bad_words });
    return;
  }
}
skipToxicityRef.current = false;
  setToxicityWarning(null);
  setLoading(true);
    abortControllerRef.current = new AbortController();
    const isDev = import.meta.env.MODE === "development";
    try {
      if (isDev) console.group("📌 Creating Post");
      const formData = new FormData();
      formData.append("content", content);
      formData.append("visibility", visibility);
      if (user?.locationCoords) {
        const { coordinates } = user.locationCoords;
        formData.append("location", JSON.stringify({ coords: { type: "Point", coordinates }, city: user.currentCity, country: user.country }));
      }
      images.forEach((file) => formData.append("media", file));
      videos.forEach((file) => formData.append("media", file));
      if (audio) formData.append("media", audio);
      if (youtubePreview) {
        formData.append("youtubeVideoId", youtubePreview.videoId);
        formData.append("youtubeEmbedUrl", youtubePreview.embedUrl);
        formData.append("youtubeType", youtubeType || "url");
      }
      const res = await axios.post(`${import.meta.env.VITE_SERVER}api/posts/add`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortControllerRef.current.signal,
        timeout: 0,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(percent);
            setUploadState(percent < 100 ? "Uploading..." : "Processing...");
          }
        },
      });
      if (isDev) console.groupEnd();
      if (res.status >= 200 && res.status < 300) {
        showAlert("✅ Post published successfully!", "success");
        clearDraft();
        setContent(""); setImages([]); setVideos([]); setVisibility("public");
        setYoutubeInput(""); setYoutubePreview(null); setYoutubeError(""); setYoutubeType(null);
        sessionStorage.setItem('just_posted', JSON.stringify({
            post: res.data.post,
            timestamp: Date.now()
          }));
          console.log("returned post data", res.data.post);
        setTimeout(() => navigate("/"), 3000);
        setUploadProgress(0); setUploadState("");
      } else {
        showAlert(res.data.message || "Something went wrong.", "error");
      }
    } catch (err) {
      setUploadProgress(0); setUploadState("");
      if (axios.isCancel(err)) showAlert("❌ Post cancelled.", "warning");
      else showAlert("Server error. Try again later.", "error");
    } finally { setLoading(false); }
  };

  const cleanupRecording = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  };

  const startRecording = async () => {
    if (images.length > 0 || videos.length > 0) return showAlert("You cannot record audio while images or videos are selected. Delete them first.", "warning");
    else if (youtubePreview) return showAlert("You cannot record audio while a YouTube video is selected. Remove it first.", "warning");
    else if (audio) return showAlert("Audio already selected. Remove it first to record new audio.", "warning");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        cleanupRecording();
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: "audio/webm" });
        setAudio(file);
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) { showAlert("Unable to access microphone.", "error"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (youtubePreview) return showAlert("You cannot upload audio while a YouTube video is selected. Remove it first.", "warning");
    if (file.size > 10 * 1024 * 1024) return showAlert("Audio file exceeds 10MB.", "warning");
    setAudio(file);
  };

  /* Char count coloring */
  const charPct = content.length / MAX_TEXT_LENGTH;
  const charClass = charPct >= 1 ? "at-limit" : charPct >= 0.85 ? "near-limit" : "";

  return (
    <>
      <style>{styles}</style>

      <div className="cp-page">
        <BackButton top="2" right="2" />

        {alert && <div style={{ position: "fixed", inset: 0, background: "rgba(5,13,58,0.35)", zIndex: 30 }} />}

        <div className="cp-inner">
          {/* Page header */}
          <div className="cp-head">
            <div className="cp-head-eyebrow">
              <span>✦</span> New Post
            </div>
            <h1 className="cp-head-title">Create Post</h1>
            <p className="cp-head-sub">Share your thoughts with the community</p>
          </div>

          {/* Main card */}
          <div className="cp-card">

            {/* User row */}
            <div className="cp-user-row">
              <ProfileAvatar
                user={{ name: user?.name || "User", profilePicUrl: user?.profilePicUrl, profilePicBackground: user?.profilePicBackground }}
                size={48}
              />
              <div className="cp-user-info">
                <h2>{user.full_name}</h2>
                <p>@{user.username}</p>
              </div>
            </div>

            {/* Composer */}
            <div className="cp-composer">
              <textarea
                ref={textareaRef}
                className="cp-textarea"
                placeholder="What's on your mind?"
                value={content}
                onChange={handleTextChange}
                onPaste={handlePaste}
                disabled={loading}
              />
              <div className="cp-composer-rule" />
              <div className={`cp-char-count ${charClass}`}>
                {content.length} / {MAX_TEXT_LENGTH}
              </div>
            </div>

            {/* Visibility */}
            <div className="cp-visibility-row">
              <span className="cp-visibility-label">Visibility</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="cp-visibility-select"
              >
                <option value="public">🌍 Public</option>
                <option value="friends">👥 Friends</option>
                <option value="private">🔒 Private</option>
                <option value="unlisted">🔗 Unlisted</option>
              </select>
            </div>

            {/* YouTube section — desktop only */}
            {!isMobile && (
              <div className="cp-yt-section">
                <div className="cp-yt-label">
                  <Youtube size={16} />
                  <span>Add YouTube Video</span>
                </div>
                <div className={`cp-yt-input-wrap${youtubePreview ? " has-preview" : ""}${youtubeError ? " has-error" : ""}`}>
                  <Link size={15} />
                  <input
                    id="youtubeInput"
                    type="text"
                    value={youtubeInput}
                    onChange={handleYoutubeInputChange}
                    placeholder="Paste YouTube URL or embed code…"
                    className="cp-yt-input"
                    disabled={loading}
                  />
                  {youtubePreview && (
                    <button onClick={handleRemoveYoutube} className="cp-yt-remove" title="Remove YouTube video">
                      <X size={13} />
                    </button>
                  )}
                </div>
                {youtubeError && (
                  <div className="cp-yt-error">
                    <AlertCircle size={12} /> <span>{youtubeError}</span>
                  </div>
                )}
                {youtubePreview && (
                  <div className="cp-yt-preview">
                    <div className="cp-yt-preview-iframe-wrap">
                      <iframe
                        src={youtubePreview.embedUrl}
                        title="YouTube video preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="cp-yt-preview-meta">
                      <span>{youtubeType === "iframe" ? "Embed code detected" : "URL detected"}</span>
                      <span>ID: {youtubePreview.videoId}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Media thumbnails */}
            {(images.length > 0 || videos.length > 0) && (
              <div className="cp-media-grid">
                {images.map((img, i) => (
                  <div key={i} className="cp-thumb">
                    <img src={URL.createObjectURL(img)} alt="Upload" className="cp-thumb-img" />
                    <button className="cp-thumb-remove" onClick={() => setImages(images.filter((_, idx) => idx !== i))}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {videos.map((vid, i) => (
                  <div key={i} className="cp-thumb">
                    <video src={URL.createObjectURL(vid)} className="cp-thumb-vid" controls />
                    <button className="cp-thumb-remove" onClick={() => setVideos(videos.filter((_, idx) => idx !== i))}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Audio preview */}
            {audio && (
              <div className="cp-audio-preview">
                <AudioMessage msg={{ media_url: URL.createObjectURL(audio) }} />
                <button onClick={() => setAudio(null)} className="cp-audio-remove" title="Remove audio">
                  <Trash2 size={15} />
                </button>
              </div>
            )}

            {/* Footer toolbar */}
            <div className="cp-footer">
              <div className="cp-tools">
                {/* Audio upload */}
                <label htmlFor="audioFile" className="cp-tool-btn" title={audio ? "Audio selected" : "Upload audio file"}>
                  <Headphones size={18} />
                </label>
                <input type="file" id="audioFile" accept="audio/*" hidden onChange={handleAudioUpload} />

                {/* Record / Stop */}
                {!recording ? (
                  <button onClick={startRecording} className="cp-tool-btn rec-dot" title="Start recording">
                    <span style={{ fontSize: 18, lineHeight: 1 }}>⏺</span>
                  </button>
                ) : (
                  <button onClick={stopRecording} className="cp-tool-btn recording" title="Stop recording">
                    <span style={{ fontSize: 18, lineHeight: 1 }}>⏹</span>
                  </button>
                )}

                <div className="cp-tool-divider" />

                {/* Images */}
                <label htmlFor="images" className="cp-tool-btn" title="Upload images">
                  <Image size={18} />
                </label>
                <input type="file" id="images" accept="image/*" hidden multiple onChange={handleImageUpload} />

                {/* Videos */}
                <label htmlFor="videos" className="cp-tool-btn" title="Upload video">
                  <VideoIcon size={18} />
                </label>
                <input type="file" id="videos" accept="video/*" hidden multiple onChange={handleVideoUpload} />

                {/* YouTube focus — desktop only */}
                {!isMobile && (
                  <button
                    onClick={() => { const el = document.getElementById("youtubeInput"); if (el) el.focus(); }}
                    className={`cp-tool-btn${youtubePreview ? " active" : ""}`}
                    title="Add YouTube video"
                  >
                    <Youtube size={18} />
                  </button>
                )}
              </div>

              {/* Action buttons */}
              <div className="cp-actions">
                {loading && (
                  <button
                    onClick={() => { if (abortControllerRef.current) abortControllerRef.current.abort(); setLoading(false); }}
                    className="cp-cancel-btn"
                  >
                    Cancel
                  </button>
                )}
                {!recording && (
  <button
    onClick={handleSubmit}
    disabled={loading || toxicityLoading}
    className="cp-publish-btn"
  >
    {toxicityLoading ? (
      <><span className="cp-publish-dot" /> Checking…</>
    ) : loading ? (
      <><span className="cp-publish-dot" /> Publishing…</>
    ) : (
      <>Publish Post</>
    )}
  </button>
)}
              </div>
            </div>

{/* ── Toxicity inline banner ───────────────────────── */}
{toxicityWarning && (() => {
  const words = toxicityWarning.bad_words?.map((w) => w.word.toLowerCase()) || [];
  const parts = content.split(/(\s+)/);
  const pct = Math.round(toxicityWarning.score * 100);
  const isHigh = toxicityWarning.score > 0.85;
  const scoreColor = isHigh ? "var(--danger)" : "var(--warning)";
  const scoreBg    = isHigh ? "rgba(220,38,38,0.1)" : "rgba(245,158,11,0.1)";
  const scoreBorder= isHigh ? "rgba(220,38,38,0.2)" : "rgba(245,158,11,0.2)";
  const scoreGrad  = isHigh
    ? "linear-gradient(90deg, #f87171, #dc2626)"
    : "linear-gradient(90deg, #fcd34d, #f59e0b)";

  const allChips    = toxicityWarning.bad_words || [];
  const previewChips = allChips.slice(0, 2);
  const extraCount   = allChips.length - previewChips.length;

  return (
    <div className="cp-tox">

      {/* ── Collapsed header — always visible ── */}
      <div
        className="cp-tox-header"
        onClick={() => setToxicityExpanded((v) => !v)}
        role="button"
        aria-expanded={toxicityExpanded}
      >
        <span className="cp-tox-icon">⚠️</span>
        <span className="cp-tox-label">Flagged</span>
        <span className="cp-tox-dot" />

        {/* Score badge */}
        <span
          className="cp-tox-score-badge"
          style={{ color: scoreColor, background: scoreBg, borderColor: scoreBorder }}
        >
          {pct}%
        </span>

        {/* Inline word chips preview */}
        <div className="cp-tox-chips-row">
          {previewChips.map((w, i) => (
            <span key={i} className="cp-tox-chip-sm">{w.word}</span>
          ))}
          {extraCount > 0 && (
            <span className="cp-tox-more-count">+{extraCount} more</span>
          )}
        </div>

        {/* Toggle */}
        <button className="cp-tox-toggle-btn" tabIndex={-1}>
          {toxicityExpanded ? "Collapse" : "Review"}
          <svg
            className={`cp-tox-chevron${toxicityExpanded ? " open" : ""}`}
            width="11" height="11" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* ── Expandable body ── */}
      <div className={`cp-tox-body${toxicityExpanded ? " open" : ""}`}>
        <div className="cp-tox-body-inner">
          <div className="cp-tox-body-content">

            {/* Score bar */}
            <div className="cp-tox-bar-row">
              <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                Tone
              </span>
              <div className="cp-tox-bar-track">
                <div className="cp-tox-bar-fill" style={{ width: `${pct}%`, background: scoreGrad }} />
              </div>
              <span className="cp-tox-bar-label" style={{ color: scoreColor }}>
                {pct}%
              </span>
            </div>

            {/* Text preview with highlights */}
            {words.length > 0 && (
              <div className="cp-tox-preview">
                <div className="cp-tox-preview-eyebrow">Flagged words in your text</div>
                <p style={{ margin: 0 }}>
                  {parts.map((part, i) => {
                    const clean = part.toLowerCase().replace(/[^a-z]/g, "");
                    const isMatch = words.some((w) =>
                      part.toLowerCase() === w || clean === w
                    );
                    return isMatch ? (
                      <mark key={i} style={{
                        background: "rgba(220,38,38,0.12)",
                        color: "var(--danger)",
                        fontWeight: 700,
                        borderRadius: 3,
                        padding: "1px 2px",
                        border: "1px solid rgba(220,38,38,0.2)",
                        textDecoration: "underline",
                        textDecorationStyle: "wavy",
                        textDecorationColor: "rgba(220,38,38,0.35)",
                      }}>
                        {part}
                      </mark>
                    ) : (
                      <span key={i}>{part}</span>
                    );
                  })}
                </p>
              </div>
            )}

            {/* All flagged chips */}
            {allChips.length > 0 && (
              <div className="cp-tox-all-chips">
                <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600 }}>
                  Flagged:
                </span>
                {allChips.map((w, i) => (
                  <span key={i} className="cp-tox-chip-full">
                    {w.word}
                    <span className="cp-tox-chip-weight">×{w.weight.toFixed(1)}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="cp-tox-footer">
              <p className="cp-tox-hint-text">
                Edit above, then tap{" "}
                <strong style={{ color: "var(--primary-color)" }}>Publish</strong> again.
              </p>
              <button
                className="cp-tox-post-anyway"
                onClick={() => {
                  skipToxicityRef.current = true;
                  setToxicityWarning(null);
                  setToxicityExpanded(false);
                  handleSubmit();
                }}
              >
                Post anyway →
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
})()}

{/* Upload progress */}
{uploadProgress > 0 && (
              <div className="cp-progress-wrap">
                <div className="cp-progress-label">
                  <span>
                    {uploadState === "Processing..." ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span className="cp-spin">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                          </svg>
                        </span>
                        Processing…
                      </span>
                    ) : uploadState}
                  </span>
                  {uploadState === "Uploading..." && <span>{uploadProgress}%</span>}
                </div>
                <div className="cp-progress-track">
                  <div
                    className={`cp-progress-fill${uploadState === "Processing..." ? " processing" : ""}`}
                    style={{ width: uploadState === "Uploading..." ? `${uploadProgress}%` : "100%" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {alert && <CustomAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </>
  );
};

export default CreatePost;
