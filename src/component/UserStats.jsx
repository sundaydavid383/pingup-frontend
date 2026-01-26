import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/userstate.css"; // Make sure to create this CSS file

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
    if (num >= 1000) return Math.floor(num / 1000) + "k+";
    if (num >= 100) return Math.floor(num / 100) * 100 + "+";
    if (num >= 20) return Math.floor(num / 10) * 10 + "+";
    return num.toString();
  };

  return (
    <div>
      {loading ? (
        // Shimmer loading bar
        <div
          className="relative overflow-hidden rounded-full user-shimmer-container"
          style={{
            height: "0.9rem",
            width: "10rem",
            background: "var(--bg-light)",
            boxShadow: "inset 0 0 4px rgba(255,255,255,0.05)",
          }}
        >
          <div className="absolute shimmer-layer"></div>
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
