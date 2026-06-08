import React, { useEffect, useState, useMemo } from "react";
import { X, Link as LinkIcon, Share2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axiosBase from "../utils/axiosBase";
import { useNavigate } from "react-router-dom";
import CustomAlert from "./shared/CustomAlert";
import ProfileAvatar from "./shared/ProfileAvatar";

export default function ShareModal({ post, onClose, onShareSuccess }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [friends,        setFriends]        = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [search,         setSearch]         = useState("");
  const [selected,       setSelected]       = useState(new Set());
  const [sending,        setSending]        = useState(false);
  const [alert,          setAlert]          = useState(null); // { message, type }

  // ── Fetch connections ──────────────────────
  useEffect(() => {
    if (!currentUser?._id) return;
    let canceled = false;
    setLoadingFriends(true);

    axiosBase
      .get(`/api/user/connections?userId=${currentUser._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      })
      .then((res) => {
        if (canceled) return;
        const raw = res.data?.data?.connections || [];
        setFriends(
          raw.map((conn) => ({
            _id:                conn._id || conn.id,
            name:               conn.name || conn.full_name || conn.username || "Unknown",
            username:           conn.username || "",
            profilePicUrl:      conn.profilePicUrl || "",
            profilePicBackground: conn.profilePicBackground || "#999",
          }))
        );
      })
      .catch((err) => {
        console.error("Error fetching friends:", err);
        if (!canceled) setFriends([]);
      })
      .finally(() => {
        if (!canceled) setLoadingFriends(false);
      });

    return () => { canceled = true; };
  }, [currentUser?._id]);

  // ── Filter by search ───────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return friends;
    const q = search.toLowerCase();
    return friends.filter(
      (f) =>
        (f.name     || "").toLowerCase().includes(q) ||
        (f.username || "").toLowerCase().includes(q)
    );
  }, [friends, search]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Copy link ──────────────────────────────
  const handleCopyLink = async () => {
    const link = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(link);
      setAlert({ message: "🔗 Link copied!", type: "success" });
    } catch {
      setAlert({ message: "Failed to copy link", type: "error" });
    }
  };

  // ── Send ───────────────────────────────────
  const handleSend = async () => {
    if (!currentUser) return navigate("/signin");
    if (selected.size === 0) {
      setAlert({ message: "Select at least one person to share with", type: "warning" });
      return;
    }

    setSending(true);
    try {
      const res = await axiosBase.post(
        `/api/posts/${post._id}/share`,
        { to: Array.from(selected) },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
      );

      setAlert({ message: "✅ Shared successfully!", type: "success" });
      setSelected(new Set());

      // Pass updated count back to feed
      if (typeof onShareSuccess === "function") {
        onShareSuccess(res.data.updatedSharesCount ?? 0);
      }

      setTimeout(onClose, 800);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to share post";
      setAlert({ message: msg, type: "error" });
    } finally {
      setSending(false);
    }
  };

  // ── Already-shared set (string IDs) ───────
  const alreadySharedSet = useMemo(
    () => new Set((post?.shares || []).map(String)),
    [post?.shares]
  );

  // ─────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Alert */}
      {alert && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--bg-card,#fff)] rounded-2xl shadow-2xl w-[min(480px,95vw)] z-10 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border,#e5e7eb)]">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="font-semibold text-base text-[var(--text-main,#111)]">Share post</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-light,#f3f4f6)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search + Copy */}
        <div className="flex gap-2 px-5 pt-4 pb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connections…"
            className="flex-1 border border-[var(--border,#e5e7eb)] rounded-lg px-3 py-2 text-sm bg-[var(--bg-input,#f9fafb)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-main,#111)]"
          />
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-light,#f3f4f6)] rounded-lg text-sm hover:bg-[var(--border,#e5e7eb)] transition-colors text-[var(--text-main,#111)] whitespace-nowrap"
          >
            <LinkIcon className="w-4 h-4" />
            Copy link
          </button>
        </div>

        {/* Section label */}
        <div className="px-5 pb-2 text-xs font-semibold text-[var(--text-muted,#9ca3af)] uppercase tracking-wider">
          Connections
        </div>

        {/* Friends list */}
        <div className="px-5 pb-3 overflow-y-auto max-h-72">
          {loadingFriends ? (
            <div className="grid grid-cols-4 gap-3 py-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-light,#f3f4f6)] animate-pulse" />
                  <div className="w-14 h-2.5 rounded bg-[var(--bg-light,#f3f4f6)] animate-pulse" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-[var(--text-muted,#9ca3af)] text-sm">
              <div className="text-2xl mb-2">👥</div>
              No connections found
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 py-1">
              {filtered.map((friend) => {
                const isSelected    = selected.has(String(friend._id));
                const alreadyShared = alreadySharedSet.has(String(friend._id));

                return (
                  <button
                    key={friend._id}
                    disabled={alreadyShared}
                    onClick={() => { if (!alreadyShared) toggleSelect(String(friend._id)); }}
                    className={`
                      flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all
                      ${alreadyShared
                        ? "opacity-50 cursor-not-allowed border-transparent"
                        : isSelected
                          ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm"
                          : "border-transparent hover:bg-[var(--bg-light,#f3f4f6)]"
                      }
                    `}
                  >
                    <div className="relative">
                      <ProfileAvatar
                        user={{
                          name:                friend.name,
                          profilePicUrl:       friend.profilePicUrl,
                          profilePicBackground: friend.profilePicBackground,
                        }}
                        size={40}
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--primary)] flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--text-main,#111)] truncate w-full text-center leading-tight">
                      {alreadyShared ? (
                        <span className="text-[var(--text-muted,#9ca3af)]">Shared</span>
                      ) : (
                        `@${friend.username || "user"}`
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border,#e5e7eb)]" />

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-[var(--text-muted,#9ca3af)]">
            {selected.size === 0
              ? "No one selected"
              : `${selected.size} selected`}
          </span>
          <button
            onClick={handleSend}
            disabled={sending || selected.size === 0}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all
              ${sending || selected.size === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[var(--primary)] hover:opacity-90 active:scale-95"
              }
            `}
          >
            {sending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}