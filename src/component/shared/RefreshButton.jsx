import React from 'react';

/**
 * Reusable Refresh Button Component
 * 
 * Props:
 * - onRefresh: Function to call when button is clicked
 * - isRefreshing: Boolean to show loading spinner
 * - label: Optional label text (e.g., "Refresh Feed")
 * - className: Optional additional CSS classes
 */
export default function RefreshButton({ 
  onRefresh, 
  isRefreshing = false, 
  label = "Refresh",
  className = "",
  title = "Refresh"
}) {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`
        flex items-center gap-2 px-3 py-1.5 text-sm 
        text-[var(--primary)] bg-[var(--primary)]/10 
        hover:bg-[var(--primary)]/20 rounded-lg 
        transition-colors
        ${isRefreshing ? 'opacity-70 cursor-wait' : ''}
        ${className}
      `}
      title={title}
    >
      <svg 
        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </svg>
      {isRefreshing ? 'Refreshing...' : label}
    </button>
  );
}
