import React from "react";

const ReplyBar = ({ replyTo, onClose, user }) => {
    if (!replyTo) return null;

    // Determine the message type icon
    const getMessageTypeIcon = () => {
        const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 };

        switch (replyTo.message_type) {
            case "image":
                return (
                    <svg {...iconProps}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                );
            case "audio":
                return (
                    <svg {...iconProps}>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                );
            case "video":
                return (
                    <svg {...iconProps}>
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                );
            default:
                return (
                    <svg {...iconProps}>
                        <path d="M3 10h10a8 8 0 0 1 8 8v4M3 10l6 6M3 10l6-6" />
                    </svg>
                );
        }
    };

    // Format the reply text
    const getReplyText = () => {
        if (replyTo.text) {
            return replyTo.text;
        }

        switch (replyTo.message_type) {
            case "image":
                return "📷 Image";
            case "audio":
                return "🎤 Audio";
            case "video":
                return "🎬 Video";
            default:
                return "Message";
        }
    };

    // Get sender name
    const getSenderName = () => {
        if (replyTo.from_user_id === user?._id) {
            return "yourself";
        }
        return replyTo.name || "message";
    };

    return (
        <div className="reply-bar" role="note" aria-label="Replying to message">
            <div className="reply-bar-content">
                <div className="reply-bar-label">
                    {getMessageTypeIcon()}
                    <span>Replying to {getSenderName()}</span>
                </div>
                <div className="reply-bar-text">
                    {getReplyText()}
                </div>
            </div>
            <button
                onClick={onClose}
                className="reply-bar-close"
                title="Cancel reply"
                aria-label="Cancel reply"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default ReplyBar;
