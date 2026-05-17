import React, { useContext, useEffect, useState } from "react";
import { Phone, PhoneOff, X } from "lucide-react";
import { CallContext } from "../../context/CallContext";

/**
 * IncomingCallModal
 *
 * Appears when user receives an incoming call
 * Shows caller information and accept/reject buttons
 * With auto-dismiss after 30 seconds
 */

const IncomingCallModal = ({ onAccept, onReject }) => {
  const callContext = useContext(CallContext);
  const [timeLeft, setTimeLeft] = useState(30);

  const call = callContext && callContext.currentCall ? callContext.currentCall : null;

  useEffect(() => {
    if (call) {
      console.log("📞 IncomingCallModal: Incoming call detected", {
        callId: call.callId,
        type: call.type,
        initiatorName: call.initiatorName,
        status: call.status,
      });
    }
  }, [call]);

  useEffect(() => {
    if (
      !call ||
      call.status !==
        (callContext &&
          callContext.CALL_STATES &&
          callContext.CALL_STATES.RINGING)
    ) {
      return;
    }

    console.log("📞 IncomingCallModal: Starting countdown timer", {
      timeLeft: 30,
    });

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onReject) {
            onReject("missed");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [call?.status, callContext, onReject]);

  const handleAccept = () => {
    console.log("📞 IncomingCallModal: Accept button clicked", {
      callId: call?.callId,
      type: call?.type,
    });
    if (onAccept) onAccept();
  };

  const handleReject = (reason) => {
    console.log("📞 IncomingCallModal: Reject button clicked", {
      callId: call?.callId,
      reason,
    });
    if (onReject) onReject(reason);
  };

  if (
    !call ||
    (callContext &&
      callContext.CALL_STATES &&
      call.status !== callContext.CALL_STATES.RINGING)
  ) {
    return null;
  }

  const isVideo = call.type === "video";

  return (
    <>
      <style>{`
        @keyframes icm-ring-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes icm-dot-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45); }
          50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
        }
        @keyframes icm-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .icm-card {
          animation: icm-slide-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .icm-btn-reject:hover  { background: rgba(239,68,68,0.2)  !important; transform: scale(0.97); }
        .icm-btn-accept:hover  { background: rgba(34,197,94,0.2)  !important; transform: scale(0.97); }
        .icm-close-btn:hover   { background: rgba(255,255,255,0.1) !important; }
        .icm-ring-outer { animation: icm-ring-pulse 2.4s ease-in-out infinite; }
        .icm-ring-mid   { animation: icm-ring-pulse 2.4s ease-in-out infinite 0.3s; }
        .icm-online-dot { animation: icm-dot-glow 2s ease-in-out infinite; }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(4, 8, 22, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Ambient glow behind card */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            width: 400,
            height: 200,
            background:
              "radial-gradient(ellipse, rgba(var(--primary-rgb, 59,92,203), 0.14) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Card */}
        <div
          className="icm-card"
          style={{
            position: "relative",
            background: "rgba(10, 18, 48, 0.78)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            borderTop: "0.5px solid rgba(255,255,255,0.2)",
            borderRadius: 28,
            padding: "36px 32px 28px",
            width: "100%",
            maxWidth: 340,
            margin: "0 16px",
            textAlign: "center",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            boxShadow:
              "0 0 0 0.5px rgba(var(--primary-rgb, 59,92,203), 0.15), 0 32px 72px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Close button */}
          <button
            onClick={() => handleReject("declined")}
            className="icm-close-btn"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.05)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: "50%",
              cursor: "pointer",
              color: "var(--text-muted, #64748b)",
              transition: "background 0.15s",
              padding: 0,
            }}
          >
            <X size={14} />
          </button>

          {/* Avatar ring system */}
          <div
            style={{
              position: "relative",
              width: 96,
              height: 96,
              margin: "0 auto 20px",
            }}
          >
            {/* Outer ring */}
            <div
              className="icm-ring-outer"
              style={{
                position: "absolute",
                inset: -10,
                borderRadius: "50%",
                border: "0.5px solid rgba(var(--primary-rgb, 59,92,203), 0.25)",
              }}
            />
            {/* Mid ring */}
            <div
              className="icm-ring-mid"
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: "50%",
                border: "0.5px solid rgba(var(--primary-rgb, 59,92,203), 0.4)",
              }}
            />

            {/* Avatar */}
            {call.initiatorImage ? (
              <img
                src={call.initiatorImage}
                alt={call.initiatorName}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1.5px solid rgba(var(--primary-rgb, 59,92,203), 0.5)",
                  position: "relative",
                  zIndex: 2,
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--secondary, #1a294a) 0%, #0d1a35 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  fontWeight: 600,
                  color: "rgba(var(--primary-rgb, 59,92,203), 0.9)",
                  border: "1.5px solid rgba(var(--primary-rgb, 59,92,203), 0.45)",
                  position: "relative",
                  zIndex: 2,
                  letterSpacing: -1,
                }}
              >
                {call.initiatorName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "??"}
              </div>
            )}

            {/* Online dot */}
            <div
              className="icm-online-dot"
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                width: 12,
                height: 12,
                background: "#22c55e",
                borderRadius: "50%",
                border: "2px solid rgba(10, 18, 48, 0.9)",
                zIndex: 3,
              }}
            />
          </div>

          {/* Caller name */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "var(--white, #ffffff)",
              letterSpacing: "-0.3px",
              marginBottom: 6,
            }}
          >
            {call.initiatorName}
          </div>

          {/* Call type tag */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "rgba(var(--primary-rgb, 59,92,203), 0.9)",
              background: "rgba(var(--primary-rgb, 59,92,203), 0.1)",
              border: "0.5px solid rgba(var(--primary-rgb, 59,92,203), 0.28)",
              padding: "3px 11px",
              borderRadius: 20,
              marginBottom: 14,
            }}
          >
            {isVideo ? (
              <>
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Incoming video call
              </>
            ) : (
              <>
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Incoming audio call
              </>
            )}
          </div>

          {/* Countdown */}
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted, #64748b)",
              marginBottom: 22,
              letterSpacing: "0.02em",
            }}
          >
            Auto-dismiss in{" "}
            <span
              style={{
                color: "var(--text-secondary, #94a3b8)",
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {timeLeft}s
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "0.5px",
              background: "rgba(255,255,255,0.06)",
              margin: "0 -4px 22px",
            }}
          />

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => handleReject("declined")}
              className="icm-btn-reject"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "13px 0",
                borderRadius: 16,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                border: "0.5px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.1)",
                color: "#fca5a5",
                transition: "background 0.15s, transform 0.15s",
                letterSpacing: "0.01em",
              }}
            >
              <PhoneOff size={16} />
              Decline
            </button>

            <button
              onClick={handleAccept}
              className="icm-btn-accept"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "13px 0",
                borderRadius: 16,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                border: "0.5px solid rgba(34,197,94,0.3)",
                background: "rgba(34,197,94,0.1)",
                color: "#86efac",
                transition: "background 0.15s, transform 0.15s",
                letterSpacing: "0.01em",
              }}
            >
              <Phone size={16} />
              Accept
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default IncomingCallModal;