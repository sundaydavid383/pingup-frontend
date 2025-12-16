import React, { useEffect, useState } from "react";
import { X, Check, InfoIcon, AlertCircle, MailWarning } from "lucide-react";

const CustomAlert = ({ message, type = "info", onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const duration = type === "success" ? 9000 : 6000;
    const timer = setTimeout(() => setVisible(false), duration);
    const closeTimer = setTimeout(() => onClose(), duration + 400);
    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [type, onClose]);

  const background = {
    success: "var(--success)",
    error: "var(--error)",
    info: "var(--info)",
    warning: "var(--warning)",
  };

  const icon = {
    success: Check,
    error: AlertCircle,
    info: InfoIcon,
    warning: MailWarning,
  };

  const Icon = icon[type];

  return (
    <>
{/* Alert Box */}
{visible && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
    <div
      className={`transform transition-all duration-300 ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div
        className="flex items-start gap-3 p-4 rounded-lg shadow-lg border bg-[var(--bg-main)] text-white max-w-md w-full"
        style={{ borderColor: background[type] || "var(--info)" }}
      >
        {/* Icon */}
        <Icon
          className="text-2xl pt-0.5 flex-shrink-0"
          style={{ color: background[type] || "var(--info)" }}
        />

        {/* Message + Button */}
        <div className="flex-1">
          <p className="text-sm sm:text-base font-medium">{message}</p>

          <button
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="mt-3 px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm transition 
              bg-[var(--primary)] text-white hover:bg-[var(--btn-hover)] 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] btn"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </>
  );
};

export default CustomAlert;
