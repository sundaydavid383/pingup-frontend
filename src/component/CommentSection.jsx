import React, { useEffect, useState, useRef } from "react";
import DOMPurify from "dompurify";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosBase from "../utils/axiosBase";
import { Trash2, Pencil } from "lucide-react";
import CommentText from "./shared/CommentText";
import CommentSkeleton from "./skeleton/CommentSkeleton";
import ProfileAvatar from "./shared/ProfileAvatar";



export default function CommentSection({ postId, initial = [], onCommentAdded }) {
  const { user: currentUser, token } = useAuth() || {};
  const navigate = useNavigate();

  const [comments, setComments] = useState(initial || []);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [updatingId, setUpdatingId] = useState(null); 
  const [editError, setEditError] = useState("");





  const inputRef = useRef(null);
  const intervalRef = useRef(null);
  const menuRefs = useRef({});


useEffect(() => {
  function handleClickOutside(e) {
    if (!openMenuId) return;
    const menuEl = menuRefs.current[openMenuId];
    if (menuEl && !menuEl.contains(e.target)) {
      setOpenMenuId(null);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [openMenuId]);


  // Fetch comments
  const fetchComments = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await axiosBase.get(`/api/posts/${postId}/comments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setComments(res.data.comments ?? res.data.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Cycle highlighted comment
  useEffect(() => {
    if (!showAll && comments.length > 1) {
      intervalRef.current = setInterval(() => {
        setHighlightIndex((prev) => (prev + 1) % comments.length);
      }, 5000);
      return () => clearInterval(intervalRef.current);
    }
  }, [comments, showAll]);

  // Post comment
  const handlePost = async () => {
    if (!currentUser) return navigate("/signin");
    const trimmed = text.trim();
    if (!trimmed) return;

    setPosting(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      user: currentUser,
      pending: true,
    };
    setComments([optimistic, ...comments]);
    setText("");
    inputRef.current?.blur();

    try {
      const res = await axiosBase.post(
        `/api/posts/${postId}/comments`,
        { text: trimmed },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const created = res.data.comment ?? res.data.data ?? res.data;
      setComments((prev) =>
        prev.map((c) => (c._id === tempId ? { ...created, pending: false } : c))
      );
      onCommentAdded && onCommentAdded(created);
    } catch (err) {
      setComments((prev) =>
        prev.map((c) =>
          c._id === tempId ? { ...c, pending: false, failed: true } : c
        )
      );
      console.error(err);
    } finally {
      setPosting(false);
    }
  };


  const handleEditSubmit = async (commentId) => {
  if (!editingText.trim()) return;
  setUpdatingId(commentId);
  setEditError("");

  try {
    const res = await axiosBase.put(
      `/api/posts/${postId}/comments/${commentId}`,
      { text: editingText },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setComments(prev =>
      prev.map(c =>
        c._id === commentId ? { ...c, text: editingText, isEdited: true } : c
      )
    );

    setEditingId(null);
  } catch (err) {
    console.error(err);
    setEditError("Failed to edit comment");
  } finally {
    setUpdatingId(null);
  }
};


  const displayedComments = showAll ? comments : comments.slice(highlightIndex, highlightIndex + 1);
  
  return (
    <div className="border-t border-gray-200 mt-4 p-3 w-full bg-white rounded-lg shadow-sm">
      {/* Comments display */}
      <div className="mb-3 space-y-2 max-h-64 overflow-y-auto">
        {loading ? (
         <>
    {Array.from({ length: 3 }).map((_, i) => (
      <CommentSkeleton key={i} />
    ))}
  </> ) : displayedComments.length === 0 ? (
          <div className="text-gray-400 text-sm text-center">No comments yet.</div>
        ) : (
// Inside your render for comments
displayedComments.map((c) => {
const handleDelete = async () => {
  if (!token) return navigate("/signin");

  setDeletingId(c._id); // start loading

  try {
    const res = await axiosBase.delete(
      `/api/posts/${postId}/comments/${c._id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Remove deleted comment from UI
    setComments((prev) => prev.filter((com) => com._id !== c._id));

    // SHOW SUCCESS ALERT USING BACKEND MESSAGE
  if (openMenuId === c._id) setOpenMenuId(null);

  } catch (err) {
    console.error(err);

    setAlert({
      open: true,
      message: err?.response?.data?.message || "Failed to delete comment",
      type: "error",
    });

  } finally {
    setDeletingId(null);
  }
};




  return (
    <div
      key={c._id}
      className="flex items-start gap-3 relative"
    >
      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
        {c.user?.profilePicUrl ? (
          <img src={c.user.profilePicUrl} alt="user" className="w-full h-full object-cover" />
        ) : (
          <div className="text-sm font-semibold text-gray-600 flex items-center justify-center h-full">
            {(c.user?.full_name || c.user?.username || "U")[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 mb-3">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">{c.user?.full_name || c.user?.username}</div>
{/* Action menu trigger (3 dots) */}
{c.user?._id === currentUser?._id && (
  <div className="relative" ref={el => menuRefs.current[c._id] = el}>
<button
  onClick={() =>
    setOpenMenuId(openMenuId === c._id ? null : c._id)
  }
  className="p-2 rounded-full 
             hover:bg-[var(--hover-light)] 
             transition-all duration-200 
             flex items-center justify-center
             text-gray-500 hover:text-[var(--accent)]
             active:scale-95 mr-4"
>
  <span className="text-xl leading-none select-none">⋮</span>
</button>


    {/* Dropdown menu */}
    {openMenuId === c._id && (
      <div
        className="absolute right-0 mt-1 w-28 bg-white border rounded-md shadow-md
                   flex flex-col py-1 z-30 animate-fadeIn"
        style={{ borderColor: "var(--input-border)" }}
      >
<button
  onClick={handleDelete}
  disabled={deletingId === c._id}
  className={`flex items-center gap-2 text-sm px-3 py-2 
              text-[var(--danger)] hover:bg-[var(--hover-light)]
              text-left transition cursor-pointer
              ${deletingId === c._id ? "opacity-60 cursor-not-allowed" : ""}`}
>
  {deletingId === c._id ? (
    // SPINNER
    <svg
      className="animate-spin h-4 w-4 text-[var(--danger)]"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
      ></path>
    </svg>
  ) : (
    <Trash2 size={14} />
  )}
  {deletingId === c._id ? "Deleting…" : "Delete"}
</button>


<button
  onClick={() => {
    setEditingId(c._id);
    setEditingText(c.text);
    setOpenMenuId(null); // close dropdown when editing
  }}
  className="flex items-center gap-2 text-sm px-3 py-2 
             text-[var(--accent)] hover:bg-[var(--hover-light)]
             text-left transition cursor-pointer"
>
  <Pencil size={14} />
  Edit
</button>


      </div>
    )}
  </div>
)}


        </div>
        <div className="text-xs text-gray-400">{moment(c.createdAt).fromNow()}</div>
{editingId === c._id ? (
  <div className="flex flex-col gap-1 mt-1">
    <div className="flex gap-2">
<textarea
  value={editingText}
  onChange={(e) => {
    // Limit max characters
    if (e.target.value.length <= 500) { // max 300 chars
      setEditingText(e.target.value);
    }

    // Auto-resize logic with max height
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto"; // reset height
      const maxHeight = 150; // maximum height in px
      el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
    }
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // prevent newline
      handleEditSubmit(c._id);
    }
    if (e.key === "Escape") setEditingId(null); // cancel
  }}
  autoFocus
  rows={1} // initial height
  maxLength={300} // character limit
  ref={inputRef}
  style={{ borderRadius: "6px" }} // border radius
  className="flex-1 min-w-0 border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none overflow-auto"
/>



      <button
        onClick={() => handleEditSubmit(c._id)}
        className="px-3 py-1 bg-[var(--primary)] text-white rounded-full text-sm hover:bg-[var(--btn-hover)] transition flex items-center"
      >
        {updatingId === c._id ? (
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        ) : (
          "Save"
        )}
      </button>

      <button
        onClick={() => setEditingId(null)}
        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition"
      >
        Cancel
      </button>
    </div>

    {/* Inline error message */}
    {editError && <div className="text-red-500 text-xs">{editError}</div>}
  </div>
) : (
<CommentText text={c.text} isEdited={c.isEdited} maxChars={150} />

)}



        {c.pending && <div className="text-xs text-gray-500 mt-1">sending…</div>}
        {c.failed && (
          <div onClick={handlePost} className="text-[10px] text-[var(--error)] cursor-pointer">
            Failed to post retry
          </div>
        )}
      </div>
    </div>
  );
})

        )}
      </div>

      {/* Comment input */}
<div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-2">
<ProfileAvatar user={currentUser} size={36} />

<textarea
  ref={inputRef}
  value={text}
  onChange={(e) => {
    // Enforce maxLength manually for pasted content
    if (e.target.value.length <= 500) {
      setText(e.target.value);
    }

    // Auto-resize logic with max height
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto"; // reset height
      const maxHeight = 150; // maximum height in px
      el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
    }
  }}
  placeholder={currentUser ? "Write a comment..." : "Sign in to comment"}
  disabled={!currentUser || posting}
  rows={1} // initial height
  maxLength={500} // character limit
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // prevent newline
      handlePost();
    }
  }}
  style={{ borderRadius: "6px" }} // border radius
  className="flex-1 min-w-0 border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none overflow-auto"
/>



  <button
    onClick={handlePost}
    disabled={!currentUser || posting || !text.trim()}
    className={`bg-blue-500 flex-shrink-0 btn ${posting ? "opacity-50" : ""}`}
  >
    Send
  </button>
</div>


      {/* Show all / cancel */}
      {comments.length > 1 && (
        <div className="mt-2 text-right">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showAll ? "Collapse" : "View all comments"}
          </button>
        </div>
      )}


    </div>
  );
}
