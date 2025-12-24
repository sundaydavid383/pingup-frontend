import React, { useEffect, useState } from "react";
import axios from "axios";

const UserStats = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_SERVER}api/user/total-users`
        );
        if (res.data.success) {
          setTotalUsers(res.data.totalUsers);
        }
      } catch (err) {
        console.error("❌ Error fetching total users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTotalUsers();
  }, []);

  // Format large numbers nicely
  const formatNumber = (num) => {
    if (num >= 1000) {
      return Math.floor(num / 1000) + "k+";
    } else if (num >= 100) {
      return Math.floor(num / 100) * 100 + "+";
    } else if (num >= 20) {
      return Math.floor(num / 10) * 10 + "+";
    } else {
      return num.toString();
    }
  };

  return (
    <div>
      {loading ? (
        // 🔥 Uses your global shimmer + root color system
        <div
          className="relative overflow-hidden rounded-full"
          style={{
            height: "0.9rem",
            width: "10rem",
            background: "var(--bg-light)",
            boxShadow: "inset 0 0 4px rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="absolute inset-0 shimmer"
            style={{
              background:
                "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
              animation: "shimmer 3s infinite",
            }}
          ></div>
        </div>
      ) : (
        <p className="text-xs md:text-sm text-[var(--hover-dark)] animate-fadeIn">
          Used by {formatNumber(totalUsers)} Individuals
        </p>
      )}
    </div>
  );
};

export default UserStats;
