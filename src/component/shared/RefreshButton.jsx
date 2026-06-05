import React from 'react';

export default function RefreshButton({ 
  onRefresh, 
  isRefreshing = false, 
  className = "",
  scrollTargetRef = null, // pass mainRef for Feed, null for others
}) {
  const handleClick = () => {
    // Scroll to top first
    if (scrollTargetRef?.current) {
      scrollTargetRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onRefresh();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isRefreshing}
      title="Refresh"
      className={`
        fixed bottom-20 right-4 z-50
        flex items-center justify-center
        w-11 h-11 rounded-full shadow-lg
        bg-[var(--primary)] text-white
        hover:bg-[var(--primary-dark)] 
        transition-all duration-200
        ${isRefreshing ? 'opacity-70 cursor-wait' : 'hover:scale-110 active:scale-95'}
        ${className}
      `}
    >
      <svg 
        className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
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
    </button>
  );
}