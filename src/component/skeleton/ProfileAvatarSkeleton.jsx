import React from "react";
import "../../styles/skeleton.css";

const ProfileAvatarSkeleton = ({ size = 96 }) => {
  return (
    <div
      className="skeleton-avatar"
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
      }}
    />
  );
};

export default ProfileAvatarSkeleton;
