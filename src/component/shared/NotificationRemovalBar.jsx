import { useEffect, useState } from "react";

const NotificationRemovalBar = () => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(12, 0, 0, 0);
      if (now > target) target.setDate(target.getDate() + 1);
      const diff = target - now;
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        .gn-removal-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 11px 20px;
          background: #fef9e7;
          border: 1px solid #fdd663;
          border-radius: 12px;
          font-family: 'Google Sans Text', 'Segoe UI', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #5f4e00;
          box-shadow: 0 1px 4px rgba(0,0,0,.08);
        }
        .gn-removal-bar svg {
          color: #f9a825;
          flex-shrink: 0;
          animation: gn-tick .8s ease-in-out infinite alternate;
        }
        @keyframes gn-tick {
          from { opacity: 1; }
          to   { opacity: .55; }
        }
        .gn-removal-timer {
          font-weight: 700;
          color: #e37400;
          font-variant-numeric: tabular-nums;
        }
      `}</style>

      <div className="gn-removal-bar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Read notifications clear at 12:00 PM —&nbsp;
          <span className="gn-removal-timer">{timeLeft}</span>&nbsp;remaining
        </span>
      </div>
    </>
  );
};

export default NotificationRemovalBar;