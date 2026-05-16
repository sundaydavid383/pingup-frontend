import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const CustomAlert = ({
  message,
  type = "info",
  onClose,
  position = "top-right",
  duration = null,
  showClose = true,
}) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Auto-dismiss duration
  const autoDuration =
    duration !== null
      ? duration
      : type === "success" ? 4800
      : type === "error" ? 6500
      : 5500;

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setVisible(true), 10);

    const dismissTimer = setTimeout(() => {
      handleClose();
    }, autoDuration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [autoDuration]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 400); // Match exit animation duration
  };

  // Sophisticated position classes with better spacing
  const positionClasses = {
    "top-right": "top-8 right-8",
    "top-left": "top-8 left-8",
    "bottom-right": "bottom-8 right-8",
    "bottom-left": "bottom-8 left-8",
    "top-center": "top-8 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-8 left-1/2 -translate-x-1/2",
  };

  const bgColors = {
    success: "bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-400/50",
    error: "bg-gradient-to-br from-red-600 to-red-700 border-red-400/50",
    warning: "bg-gradient-to-br from-amber-600 to-amber-700 border-amber-400/50",
    info: "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400/50",
  };

  const iconColors = {
    success: "text-emerald-200",
    error: "text-red-200",
    warning: "text-amber-200",
    info: "text-blue-200",
  };

  const IconComponent = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[type];

  if (!visible && !exiting) return null;

  return (
    <div
      className={`fixed z-[6000000] ${positionClasses[position]} pointer-events-auto`}
    >
      <div
        className={`
          flex items-start gap-4 px-6 py-5 rounded-3xl border shadow-2xl
          backdrop-blur-2xl min-w-[340px] max-w-[440px] text-white
          ${bgColors[type] || bgColors.info}
          transition-all duration-500 ease-out
          ${visible && !exiting 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-4 scale-95"
          }
          ${exiting 
            ? "opacity-0 -translate-y-2 scale-95" 
            : ""
          }
        `}
        style={{
          boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.4)",
        }}
      >
        {/* Icon with subtle pulse on entrance */}
        <div className={`mt-0.5 flex-shrink-0 transition-transform duration-700 ${visible ? 'scale-100' : 'scale-75'}`}>
          <IconComponent
            className={`w-7 h-7 ${iconColors[type]} drop-shadow-sm`}
            strokeWidth={2.5}
          />
        </div>

        {/* Content */}
        <div className="flex-1 pt-0.5">
          <p className="text-[15.2px] leading-tight font-medium tracking-[-0.005em] pr-6">
            {message}
          </p>
        </div>

        {/* Close Button - Elegant */}
        {showClose && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 -mt-1 -mr-2 p-2 rounded-2xl hover:bg-white/10 active:bg-white/20 transition-all duration-200 focus:outline-none group"
            aria-label="Close notification"
          >
            <X 
              className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" 
              strokeWidth={3.5}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomAlert;