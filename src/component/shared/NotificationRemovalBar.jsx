import { useEffect, useState } from "react";

const NotificationRemovalBar = () => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(12, 0, 0, 0); // 12:00 PM today

      // If it's past 12 PM, set for tomorrow
      if (now > target) target.setDate(target.getDate() + 1);

      const diff = target - now;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown(); // initialize immediately
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 w-full bg-yellow-50 border-t border-yellow-200 px-4 py-3 flex items-center justify-center text-sm text-yellow-800 font-medium shadow-inner space-x-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-yellow-700 animate-pulse"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
<span>Heads up! Read notifications will disappear by 12:00 PM — only {timeLeft} left to check them.</span>
    </div>
  );
};

export default NotificationRemovalBar;
