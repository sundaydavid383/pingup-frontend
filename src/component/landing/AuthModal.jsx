import React from 'react';
import { X } from 'lucide-react';
import AuthContainer from '../../pages/AuthContainer';

const AuthModal = ({ mode, onClose }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when modal is open — preserve original style
  React.useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[var(--bg-main)] rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <div className="sticky top-0 z-10 flex justify-end p-2">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Auth Container in Modal Mode */}
        <div className="px-6 pb-6">
          <AuthContainer initialTab={mode} onClose={onClose} isModal={true} />
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
