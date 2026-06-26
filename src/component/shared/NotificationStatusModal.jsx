import React, { useState } from "react";
import { usePushNotifications } from "../../hooks/usePushNotifications";

const NotificationStatusModal = ({ modalState, dndInfo, onDismiss, onGoToSettings }) => {
  const { requestPermissionAndSubscribe } = usePushNotifications();
  const [enabling, setEnabling] = useState(false);
  const [result, setResult] = useState(null);

  if (!modalState) return null;

  const getBrowserName = () => {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua))     return "edge";
  if (/OPR\//.test(ua))     return "opera";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "safari";
  return "chrome"; // default
};

const BROWSER_INSTRUCTIONS = {
  chrome: {
    name: "Chrome",
    icon: "🌐",
    steps: [
      "Click the 🔒 lock icon in your address bar",
      'Find "Notifications" in the dropdown',
      'Change it from "Block" to "Allow"',
      "Refresh this page",
    ],
  },
  firefox: {
    name: "Firefox",
    icon: "🦊",
    steps: [
      "Click the 🔒 lock icon in your address bar",
      'Click "Connection secure" → "More information"',
      'Go to the "Permissions" tab',
      'Find "Send notifications" and remove the block',
      "Refresh this page",
    ],
  },
  safari: {
    name: "Safari",
    icon: "🧭",
    steps: [
      'Open Safari → "Settings" → "Websites"',
      'Click "Notifications" on the left',
      "Find this site and change it to Allow",
      "Refresh this page",
    ],
  },
  edge: {
    name: "Edge",
    icon: "🌊",
    steps: [
      "Click the 🔒 lock icon in your address bar",
      'Click "Permissions for this site"',
      'Find "Notifications" and set it to "Allow"',
      "Refresh this page",
    ],
  },
  opera: {
    name: "Opera",
    icon: "🔴",
    steps: [
      "Click the 🔒 lock icon in your address bar",
      'Find "Notifications" and change to "Allow"',
      "Refresh this page",
    ],
  },
};

  const handleEnable = async () => {
    setEnabling(true);
    setResult(null);
    try {
      const res = await requestPermissionAndSubscribe();
      if (res.success) {
        setResult("success");
        setTimeout(() => onDismiss(), 1800);
      } else {
        setResult("denied");
      }
    } finally {
      setEnabling(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onDismiss}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5,13,58,0.72)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 9998,
        }}
      />

      {/* ── Modal card ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalState === "disabled" ? "Enable notifications" : "Do Not Disturb active"}
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "min(388px, 92vw)",
          background: "rgba(27, 40, 71, 0.88)",
          border: `1px solid ${modalState === "disabled"
            ? "rgba(59,92,203,0.3)"
            : "rgba(131,109,240,0.28)"}`,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(5,13,58,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
          animation: "nsm-fade-in 0.4s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <style>{`
          @keyframes nsm-fade-in {
            from { opacity: 0; transform: translate(-50%, calc(-50% + 14px)) scale(0.96); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes nsm-float {
            0%,100% { transform: translateY(0); }
            50%      { transform: translateY(-5px); }
          }
          @keyframes nsm-pulse-ring {
            0%   { transform: scale(1);    opacity: 0.7; }
            100% { transform: scale(1.6);  opacity: 0;   }
          }
          @keyframes nsm-shimmer {
            0%   { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
        `}</style>

        {/* ── Header ── */}
        <div style={{
          background: modalState === "disabled"
            ? "linear-gradient(135deg, #1a294a 0%, #1e2f5a 50%, #1a294a 100%)"
            : "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 55%, #1a1a2e 100%)",
          borderBottom: `1px solid ${modalState === "disabled"
            ? "rgba(59,92,203,0.2)"
            : "rgba(131,109,240,0.2)"}`,
          padding: "30px 24px 26px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* decorative orb */}
          <div style={{
            position: "absolute",
            width: 200, height: 200,
            borderRadius: "50%",
            top: -70, right: -50,
            background: modalState === "disabled"
              ? "radial-gradient(circle, rgba(59,92,203,0.2) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(131,109,240,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* close button */}
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            style={{
              position: "absolute", top: 16, right: 16,
              width: 30, height: 30,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#64748b",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#94a3b8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#64748b"; }}
          >
            ✕
          </button>

          {/* floating icon */}
          <div style={{
            width: 54, height: 54,
            borderRadius: 16,
            background: modalState === "disabled"
              ? "rgba(59,92,203,0.2)"
              : "rgba(131,109,240,0.2)",
            border: `1px solid ${modalState === "disabled"
              ? "rgba(59,92,203,0.4)"
              : "rgba(131,109,240,0.4)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
            position: "relative",
            animation: "nsm-float 3.5s ease-in-out infinite",
          }}>
            {/* pulse ring */}
            <div style={{
              position: "absolute", inset: -7,
              borderRadius: 23,
              border: `1px solid ${modalState === "disabled"
                ? "rgba(59,92,203,0.5)"
                : "rgba(131,109,240,0.5)"}`,
              animation: "nsm-pulse-ring 2.2s ease-out infinite",
            }} />
            <span style={{
              fontSize: 24,
              color: modalState === "disabled" ? "#7b9ef0" : "#c4b5fd",
            }}>
              {modalState === "disabled" ? "🔕" : "🌙"}
            </span>
          </div>

          <p style={{ margin: "0 0 5px", fontSize: 18, fontWeight: 600, color: "#e2e8f0", letterSpacing: "-0.2px" }}>
            {modalState === "disabled" ? "Notifications are off" : "Do Not Disturb is active"}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
            {modalState === "disabled"
              ? "You may be missing important updates from your network"
              : "Notifications are silenced during your chosen hours"}
          </p>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "22px 24px 26px" }}>

          {/* ─ DISABLED STATE ─ */}
          {modalState === "disabled" && (
            <>
              {/* pill tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {["💬 Messages", "❤️ Likes", "🔔 Connections", "📞 Calls"].map(t => (
                  <span key={t} style={{
                    background: "rgba(59,92,203,0.12)",
                    border: "1px solid rgba(59,92,203,0.25)",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 12, fontWeight: 500,
                    color: "#7b9ef0",
                  }}>{t}</span>
                ))}
              </div>

              {/* benefit rows */}
              {[
                { icon: "💬", label: "Instant message alerts", desc: "Know the moment someone reaches out — even with the tab closed" },
                { icon: "📞", label: "Incoming call alerts",   desc: "Never miss a voice or video call from your connections" },
                { icon: "🔔", label: "Activity on your posts", desc: "Likes, comments, and shares delivered in real time" },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "11px 0",
                  borderBottom: "1px solid rgba(59,92,203,0.1)",
                }}>
                  <div style={{
                    width: 34, height: 34,
                    background: "rgba(59,92,203,0.14)",
                    border: "1px solid rgba(59,92,203,0.25)",
                    borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 15,
                  }}>{icon}</div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500, color: "#cbd5e1" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}

              {/* result feedback */}
              {result === "success" && (
                <div style={{
                  marginTop: 16,
                  background: "rgba(22,163,74,0.12)",
                  border: "1px solid rgba(22,163,74,0.3)",
                  borderRadius: 12, padding: "11px 14px",
                  fontSize: 13, fontWeight: 500, color: "#4ade80",
                }}>✅ Notifications enabled — you're all set!</div>
              )}
              {result === "denied" && (() => {
  const browser = getBrowserName();
  const info = BROWSER_INSTRUCTIONS[browser];
  return (
    <div style={{
      marginTop: 16,
      background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: 14,
      padding: "16px",
    }}>
      <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#f87171" }}>
        {info.icon} Blocked in {info.name} — here is how to fix it:
      </p>
      {info.steps.map((step, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          marginBottom: i < info.steps.length - 1 ? 8 : 0,
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: "50%",
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 600, color: "#f87171",
            flexShrink: 0, marginTop: 1,
          }}>{i + 1}</span>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>
            {step}
          </p>
        </div>
      ))}
    </div>
  );
})()}

              {/* primary CTA */}
              <button
                onClick={handleEnable}
                disabled={enabling || result === "success"}
                style={{
                  width: "100%", marginTop: 20,
                  padding: "14px",
                  background: "linear-gradient(135deg, #3055d1 0%, #3b5ccb 50%, #4f46e5 100%)",
                  backgroundSize: "200% 100%",
                  border: "none", borderRadius: 14,
                  color: "#fff", fontSize: 15, fontWeight: 600,
                  cursor: enabling ? "wait" : "pointer",
                  opacity: enabling || result === "success" ? 0.65 : 1,
                  transition: "transform 0.15s, opacity 0.2s",
                  position: "relative", overflow: "hidden",
                  letterSpacing: "-0.1px",
                }}
                onMouseEnter={e => { if (!enabling) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <span style={{ position: "relative", zIndex: 1 }}>
                  {enabling ? "Requesting permission…" : result === "success" ? "✓ Enabled" : "🔔 Enable notifications"}
                </span>
                {/* shimmer overlay */}
                <span style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: "nsm-shimmer 2.5s ease-in-out infinite",
                }} />
              </button>

              <button
                onClick={onDismiss}
                style={{
                  width: "100%", marginTop: 10, padding: "11px",
                  background: "transparent",
                  border: "1px solid rgba(99,120,180,0.22)",
                  borderRadius: 14, color: "#64748b",
                  fontSize: 13, cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,92,203,0.07)"; e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
              >
                Maybe later
              </button>
            </>
          )}

          {/* ─ DND ACTIVE STATE ─ */}
          {modalState === "dnd_active" && (
            <>
              {/* active DND badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(109,79,212,0.12)",
                border: "1px solid rgba(109,79,212,0.28)",
                borderRadius: 14, padding: "14px 16px",
                marginBottom: 18,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#836dd0",
                  boxShadow: "0 0 0 3px rgba(131,109,240,0.25)",
                  flexShrink: 0,
                  animation: "nsm-pulse-ring 1.8s ease-out infinite",
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600, color: "#c4b5fd" }}>
                    {dndInfo?.dndFrom && dndInfo?.dndUntil
                      ? `${formatTime(dndInfo.dndFrom)} – ${formatTime(dndInfo.dndUntil)}`
                      : "DND window active"}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#6d4fd4" }}>Active DND window</p>
                </div>
                <span style={{ fontSize: 18, color: "#6d4fd4" }}>🕐</span>
              </div>

              {/* info rows */}
              {[
                { icon: "🔕", text: "All push notifications, message alerts, and call alerts are paused until your DND window ends" },
                { icon: "📥", text: "Notifications are still saved — you won't miss anything, they'll be waiting when DND ends" },
                { icon: "⚙️",  text: "You can adjust your schedule or turn off DND at any time from notification settings" },
              ].map(({ icon, text }) => (
                <div key={text} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(109,79,212,0.1)",
                }}>
                  <div style={{
                    width: 30, height: 30,
                    background: "rgba(109,79,212,0.14)",
                    border: "1px solid rgba(109,79,212,0.22)",
                    borderRadius: 9,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 14, marginTop: 1,
                  }}>{icon}</div>
                  <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.55 }}>{text}</p>
                </div>
              ))}

              <button
                onClick={() => { onDismiss(); if (onGoToSettings) onGoToSettings(); }}
                style={{
                  width: "100%", marginTop: 22, padding: "14px",
                  background: "linear-gradient(135deg, #6d4fd4 0%, #836dd0 100%)",
                  border: "none", borderRadius: 14,
                  color: "#fff", fontSize: 15, fontWeight: 600,
                  cursor: "pointer", position: "relative", overflow: "hidden",
                  transition: "transform 0.15s",
                  letterSpacing: "-0.1px",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <span style={{ position: "relative", zIndex: 1 }}>⚙️ Manage DND settings</span>
                <span style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                  backgroundSize: "200% 100%",
                  animation: "nsm-shimmer 2.5s ease-in-out infinite",
                }} />
              </button>

              <button
                onClick={onDismiss}
                style={{
                  width: "100%", marginTop: 10, padding: "11px",
                  background: "transparent",
                  border: "1px solid rgba(109,79,212,0.2)",
                  borderRadius: 14, color: "#64748b",
                  fontSize: 13, cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(109,79,212,0.08)"; e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
              >
                Keep DND on for now
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationStatusModal;