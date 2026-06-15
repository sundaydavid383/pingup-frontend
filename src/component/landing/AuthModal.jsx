import React from 'react';
import { X } from 'lucide-react';
import AuthContainer from '../../pages/AuthContainer';
import '../../styles/authModal.css';

const AuthModal = ({ mode, onClose }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  React.useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="auth-modal-backdrop" onMouseDown={handleBackdropClick}>
      {/* Ambient orbs in backdrop */}
      <div className="auth-modal-orb auth-modal-orb-1" />
      <div className="auth-modal-orb auth-modal-orb-2" />

      <div className="auth-modal-sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="auth-modal-sheet-inner"> 
        {/* Glass border shimmer line at top */}
        <div className="auth-modal-shimmer-top" />

        <button className="auth-modal-close" onClick={onClose} title="Close">
          <X size={18} />
        </button>

        <div className="auth-modal-body">
          <AuthContainer initialTab={mode} onClose={onClose} isModal={true} />
        </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;