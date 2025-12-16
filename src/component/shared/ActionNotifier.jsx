import React from 'react';
import "../../styles/ui.css"

const ActionNotifier = ({ action, onConfirm, onCancel }) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="rounded-lg p-6 w-80 shadow-lg"
        style={{
          background: 'var(--bg-light)',
          border: `1px solid var(--input-border)`,
          color: 'var(--text-main)',
        }}
      >
        <p className="text-center mb-5">
          Do you want to <span className="font-semibold text--accent">{action}</span>?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            style={{
              background: 'var(--hover-subtle-bg)',
              color: 'var(--text-secondary)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius)',
              transition: 'var(--transition-default)',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--hover-light)')}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--hover-subtle-bg)')}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: 'var(--error)',
              color: 'var(--white)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius)',
              transition: 'var(--transition-default)',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--hover-dark)')}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--error)')}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionNotifier;