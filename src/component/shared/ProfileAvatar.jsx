import React, { useState } from "react";

const ProfileAvatar = ({ user, size = 50 }) => {
  if (!user) return null;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Compute initials
  const initials = (() => {
    if (!user.name) return "?";
    const parts = user.name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  // Generate DiceBear avatar URL as fallback
  const dicebearSeed = user.email?.split("@")[0] || user.name?.replace(/\s+/g, "").toLowerCase() || "user";
  const dicebearUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${dicebearSeed}`;

  const hasProfilePic = user.profilePicUrl?.trim() && !imgError;
  const avatarUrl = hasProfilePic ? user.profilePicUrl : dicebearUrl;
  const bgColor = user.profilePicBackground || "#e6e2e2";

  const containerStyle = {
    width: size,
    height: size,
    position: "relative",
    borderRadius: "50%",
    overflow: "hidden",
    border: "3px solid var(--hover-dark)",
    userSelect: "none",
    backgroundColor: bgColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--secondary)",
    fontSize: size * 0.38,
    fontWeight: "bold",
    textTransform: "uppercase",
  };

  return (
    <div style={containerStyle}>
      {/* Image */}
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt=""
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgError(true);
          }}
          style={{
            display: imgLoaded ? "block" : "none",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* Fallback initials if image fails to load */}
      {(!imgLoaded || imgError) && initials}
    </div>
  );
};

export default ProfileAvatar;
