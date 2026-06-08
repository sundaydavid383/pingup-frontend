import React, { useEffect, useState, useMemo } from "react"; 

export default function SharedBanner({ sharedBy }){
  const navigate = useNavigate();
  if (!sharedBy) return null;
 
  const name = sharedBy?.username || sharedBy?.name || "Someone";
  const pic  = sharedBy?.profilePicUrl;
  const bg   = sharedBy?.profilePicBackground || "#999";
  const id   = sharedBy?._id;
 
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 mb-1 rounded-t-xl bg-[var(--bg-light,#f3f4f6)] border-b border-[var(--border,#e5e7eb)] cursor-pointer"
      onClick={(e) => { e.stopPropagation(); if (id) navigate(`/profile/${id}`); }}
    >
      <Share2 className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />
      <div className="flex items-center gap-1.5 min-w-0">
        {pic ? (
          <img src={pic} alt={name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div
            className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
            style={{ background: bg }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-xs text-[var(--text-muted,#6b7280)] truncate">
          <span className="font-semibold text-[var(--text-main,#111)]">@{name}</span>
          {" "}shared this post
        </span>
      </div>
    </div>
  );
};