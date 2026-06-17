import { useEffect, useRef } from "react";
import {
  MessageCircle,
  Copy,
  Trash2,
  AlertCircle,
  X,
} from "lucide-react";

const MessageOptionsDropdown = ({
  message,
  onClose,
  onReply,
  onCopy,
  onDelete,
  sentByUser,
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleContextMenu = (e) => e.preventDefault();

  const handleReply = () => { onReply(message); onClose(); };
  const handleCopy = () => { if (onCopy) onCopy(message.text || ""); onClose(); };
  const handleDeleteForMe = () => { if (onDelete) onDelete(message._id, false); onClose(); };
  const handleDeleteForEveryone = () => { if (onDelete) onDelete(message._id, true); onClose(); };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[999998]"
        style={{ background: "rgba(5,13,58,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={dropdownRef}
        onContextMenu={handleContextMenu}
        className="fixed z-[999999]"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(300px, 90vw)",
          borderRadius: "24px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.98)",
          boxShadow: "0 32px 64px rgba(26,41,74,0.30), 0 2px 12px rgba(48,85,209,0.12)",
          border: "1px solid rgba(59,92,203,0.12)",
          animation: "moSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <style>{`
          @keyframes moSlideUp {
            from { opacity: 0; transform: translate(-50%, -44%) scale(0.94); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          .mo-row {
            display: flex; align-items: center; gap: 14px;
            padding: 12px 16px; cursor: pointer;
            transition: background 0.15s ease;
            border-radius: 14px; margin: 0 8px 2px;
          }
          .mo-row:hover { background: var(--ob-surface, #f4f6fd); }
          .mo-row:active { background: var(--ob-surface-2, #edf0fb); }
          .mo-icon {
            width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
          }
          .mo-cancel-row {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            margin: 4px 12px 14px; padding: 13px 16px; cursor: pointer;
            border-radius: 14px; border: 1px solid rgba(59,92,203,0.14);
            background: var(--ob-surface, #f4f6fd);
            transition: background 0.15s ease;
          }
          .mo-cancel-row:hover { background: var(--color-6, #e6ebfa); }
          .mo-cancel-row:active { background: var(--ob-surface-2, #edf0fb); }
        `}</style>

        {/* Header */}
        <div style={{
          padding: "20px 20px 16px",
          background: "linear-gradient(135deg, var(--primary, #3055d1) 0%, var(--secondary, #1a294a) 100%)",
          display: "flex", alignItems: "center", gap: "13px",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MessageCircle size={18} color="white" />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", margin: 0 }}>
              Message options
            </p>
            
          </div>
        </div>

        {/* Actions body */}
        <div style={{ padding: "10px 0 4px" }}>

          {/* Reply */}
          <div className="mo-row" onClick={handleReply}>
            <div className="mo-icon" style={{ background: "var(--ob-surface-2, #edf0fb)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--primary,#3055d1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--secondary,#1a294a)", margin: 0 }}>Reply</p>
              <p style={{ fontSize: 11, color: "var(--text-secondary,#94a3b8)", margin: "2px 0 0" }}>Quote this message</p>
            </div>
          </div>

          {/* Copy */}
          <div className="mo-row" onClick={handleCopy}>
            <div className="mo-icon" style={{ background: "var(--ob-surface, #f4f6fd)" }}>
              <Copy size={17} color="var(--primary,#3055d1)" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--secondary,#1a294a)", margin: 0 }}>Copy text</p>
              <p style={{ fontSize: 11, color: "var(--text-secondary,#94a3b8)", margin: "2px 0 0" }}>Copy to clipboard</p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(59,92,203,0.08)", margin: "8px 16px" }} />

          {/* Delete for me */}
          <div className="mo-row" onClick={handleDeleteForMe}>
            <div className="mo-icon" style={{ background: "#fff5f5" }}>
              <Trash2 size={17} color="var(--red,#ef4444)" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--red,#ef4444)", margin: 0 }}>Delete for me</p>
              <p style={{ fontSize: 11, color: "#f87171", margin: "2px 0 0" }}>Only removed from your view</p>
            </div>
          </div>

          {/* Delete for everyone */}
          {sentByUser && (
            <div className="mo-row" onClick={handleDeleteForEveryone}>
              <div className="mo-icon" style={{ background: "#fff0f0" }}>
                <AlertCircle size={17} color="var(--danger,#dc2626)" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--danger,#dc2626)", margin: 0 }}>Delete for everyone</p>
                <p style={{ fontSize: 11, color: "#f87171", margin: "2px 0 0" }}>Removed for all participants</p>
              </div>
            </div>
          )}
        </div>

        {/* Cancel */}
        <div className="mo-cancel-row" onClick={onClose}>
          <X size={15} color="var(--primary,#3055d1)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary,#3055d1)" }}>Cancel</span>
        </div>
      </div>
    </>
  );
};

export default MessageOptionsDropdown;