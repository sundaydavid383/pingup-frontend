import { useEffect } from "react";
import { X } from "lucide-react";

export default function Toast({
  message,
  type = "error",
  duration = 3500,
  onClose,
  vibrate = true,
}) {
  useEffect(() => {
    // 📳 Haptic feedback (mobile-safe)
    if (vibrate && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]); // subtle double pulse
    }

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose, vibrate]);

  const colors = {
    error: "bg-red-600",
    warning: "bg-yellow-500",
    success: "bg-green-600",
  };

  return (
    <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-2xl animate-toast-in ${colors[type]}`}
      >
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="opacity-80 hover:opacity-100">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
