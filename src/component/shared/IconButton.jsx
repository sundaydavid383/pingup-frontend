import "../../styles/ui.css";
export const IconButton = ({ icon: Icon, label, onClick, disabled }) => {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="
          icon-glass-btn
          disabled:opacity-60
          disabled:cursor-not-allowed
        "
      >
        <Icon className="icon-glass-icon" />
      </button>

{/* Tooltip (desktop only) */}
<span className="tooltip-wrapper hidden md:flex">
  <span className="tooltip-bg"></span>
  <span className="tooltip-text">{label}</span>
</span>


    </div>
  );
};
