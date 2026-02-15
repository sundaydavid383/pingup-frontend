import { useAuth } from "../context/AuthContext";

// SVG Icons as components
const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const MessageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const UserPlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <line x1="20" y1="8" x2="20" y2="14"></line>
        <line x1="23" y1="11" x2="17" y2="11"></line>
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

export default function UserPopupCard({ user, onClose, onMessage, onConnect, onViewProfile }) {
    const { currentUser } = useAuth();

    if (!user) return null;

    const isCurrentUser = currentUser?._id === user._id;

    // Format last active time
    const formatLastActive = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const now = new Date();
        const active = new Date(timestamp);
        const diffMs = now - active;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    // Calculate distance (mock - would come from backend in real app)
    const formatDistance = (meters) => {
        if (!meters || meters < 0) return 'Unknown';
        if (meters < 1000) return `${Math.round(meters)}m away`;
        return `${(meters / 1000).toFixed(1)}km away`;
    };

    // Get initials for placeholder
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Determine status
    const status = user.isOnline ? 'online' : user.lastActive && (Date.now() - new Date(user.lastActive).getTime()) < 300000 ? 'idle' : 'offline';

    return (
        <div className="lm-popup-overlay">
            <div className="lm-popup-card">
                {/* Close button */}
                <button className="lm-popup-close" onClick={onClose} aria-label="Close">
                    <CloseIcon />
                </button>

                {/* Header with avatar and info */}
                <div className="lm-popup-header">
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.name || 'User'}
                            className="lm-popup-avatar"
                        />
                    ) : (
                        <div className="lm-popup-avatar-placeholder">
                            {getInitials(user.name)}
                        </div>
                    )}

                    <div className="lm-popup-info">
                        <h3 className="lm-popup-name">
                            {user.name || 'Anonymous User'}
                            <span className={`lm-popup-status ${status}`}></span>
                        </h3>

                        {user.bio && (
                            <p className="lm-popup-bio">{user.bio}</p>
                        )}

                        <div className="lm-popup-meta">
                            {user.distance !== undefined && (
                                <div className="lm-popup-meta-item">
                                    <LocationIcon />
                                    <span>{formatDistance(user.distance)}</span>
                                </div>
                            )}

                            <div className="lm-popup-meta-item">
                                <ClockIcon />
                                <span>
                                    {user.isOnline
                                        ? 'Active now'
                                        : `Last seen ${formatLastActive(user.lastActive)}`
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="lm-popup-actions">
                    {!isCurrentUser && (
                        <>
                            <button
                                className="lm-popup-btn lm-popup-btn-primary"
                                onClick={() => onMessage?.(user)}
                            >
                                <MessageIcon />
                                Message
                            </button>

                            <button
                                className="lm-popup-btn lm-popup-btn-secondary"
                                onClick={() => onConnect?.(user)}
                            >
                                <UserPlusIcon />
                                Connect
                            </button>
                        </>
                    )}

                    <button
                        className="lm-popup-btn lm-popup-btn-secondary"
                        onClick={() => onViewProfile?.(user)}
                        style={{ flex: isCurrentUser ? '1' : '0.5' }}
                    >
                        <EyeIcon />
                        {isCurrentUser ? 'My Profile' : 'View Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
}
