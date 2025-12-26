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

  const hasProfilePic = user.profilePicUrl?.trim() && !imgError;
  const bgColor = user.profilePicBackground || "#b3b3b3";

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
    color: "#fff",
    fontSize: size * 0.38,
    fontWeight: "bold",
    textTransform: "uppercase",
  };

  return (
    <div style={containerStyle}>
      {/* Initials while loading OR when image fails */}
      {(!imgLoaded || imgError || !hasProfilePic) && initials}

      {/* Image (hidden until loaded) */}
      {hasProfilePic && (
        <img
          src={user.profilePicUrl}
          alt=""
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          style={{
            display: imgLoaded ? "block" : "none",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
    </div>
  );
};

export default ProfileAvatar;
