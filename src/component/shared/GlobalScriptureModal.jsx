// GlobalScriptureModal.jsx - Draggable Bottom Sheet Modal for Scripture
import React, { useEffect, useRef, useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import { useScripture } from "../../context/ScriptureContext";
import { X, Maximize2, Minimize2 } from "lucide-react";

export default function GlobalScriptureModal() {
  const { 
    scriptureState, 
    closeScripture, 
    toggleFullPage,
    navigateToVerse 
  } = useScripture();
  
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  // Don't render if modal is not open
  if (!scriptureState.isModalOpen) return null;

  // Swipe handlers for dismiss
  const handlers = useSwipeable({
    onSwipedDown: ({ velocity }) => {
      // Dismiss if swipe down with sufficient velocity
      if (velocity > 0.5) {
        closeScripture();
      }
    },
    onSwipedUp: () => {
      // Swipe up to open full page
      toggleFullPage();
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeScripture();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeScripture]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeScripture();
      }}
    >
      {/* Modal Container with Swipe */}
      <div
        ref={modalRef}
        {...handlers}
        className="w-full max-w-2xl bg-[var(--secondary)] rounded-t-3xl shadow-2xl overflow-hidden"
        style={{
          maxHeight: '85vh',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drag Handle */}
        <div 
          className="flex items-center justify-between px-4 py-3 border-b border-[var(--input-border)]"
          style={{ cursor: 'grab' }}
        >
          {/* Drag indicator */}
          <div className="mx-auto w-12 h-1.5 bg-[var(--text-muted)] rounded-full" />
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullPage}
              className="p-2 rounded-full hover:bg-[var(--hover-light)] transition-colors"
              title="Open full page"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={closeScripture}
              className="p-2 rounded-full hover:bg-[var(--hover-light)] transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Swipe hint */}
        <div className="text-center text-xs text-[var(--text-muted)] py-1">
          Swipe down to close • Swipe up for full page
        </div>

        {/* Content */}
        <div 
          ref={contentRef}
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(85vh - 80px)' }}
        >
          {/* Scripture content will be rendered here */}
          {scriptureState.reference ? (
            <ScriptureContent 
              reference={scriptureState.reference}
              onVerseClick={navigateToVerse}
              highlightedVerse={scriptureState.highlightedVerse}
            />
          ) : (
            <div className="p-8 text-center text-[var(--text-muted)]">
              Select a verse to view
            </div>
          )}
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// ScriptureContent component - renders the actual scripture
function ScriptureContent({ reference, onVerseClick, highlightedVerse }) {
  // This would integrate with your existing verse rendering logic
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">
        {reference}
      </h2>
      <p className="text-lg leading-relaxed text-[var(--text-main)]">
        {/* Placeholder - integrate with your existing verse data */}
        Loading verse content...
      </p>
    </div>
  );
}
