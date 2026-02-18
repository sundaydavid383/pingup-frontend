import React, { useEffect, useState, useRef } from "react";
import DOMPurify from "dompurify";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosBase from "../utils/axiosBase";
import { Trash2, Pencil, SendHorizonal, Loader2, CornerDownRight, MessageSquare, ThumbsUp, MoreVertical } from "lucide-react";
import CommentText from "./shared/CommentText";
import CommentSkeleton from "./skeleton/CommentSkeleton";
import ProfileAvatar from "./shared/ProfileAvatar";
import CustomAlert from "./shared/CustomAlert";

export default function CommentSection({ postId, commentsCount, initial = [], onCommentAdded }) {
  const { user: currentUser, token } = useAuth() || {};
  const navigate = useNavigate();

  const [comments, setComments] = useState(initial || []);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [showAll, setShowAll] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: "", type: "error" });
  const [editingText, setEditingText] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [editError, setEditError] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const rootComments = comments.filter(c => !c.parent);
  const replies = comments.filter(c => c.parent);

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const inputRef = useRef(null);
  const editInputRef = useRef(null);
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

  useEffect(() => {
    if (!showAll && rootComments.length > 1) {
      intervalRef.current = setInterval(() => {
        setHighlightIndex((prev) => (prev + 1) % rootComments.length);
      }, 5000);
      return () => clearInterval(intervalRef.current);
    }
  }, [rootComments, showAll]);

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
      parent: replyTo?._id || null,
      pending: true,
    };
    setComments([optimistic, ...comments]);
    setText("");
    inputRef.current?.blur();

    try {
      const res = await axiosBase.post(
        `/api/posts/${postId}/comments`,
        { text: trimmed, parent: replyTo?._id || null },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const created = res.data.comment ?? res.data.data ?? res.data;
      setComments((prev) =>
        prev.map((c) => (c._id === tempId ? { ...created, pending: false } : c))
      );
      setReplyTo(null);
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
      await axiosBase.put(
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

  const handleDelete = async (commentId) => {
    if (!token) return navigate("/signin");
    setDeletingId(commentId);
    try {
      await axiosBase.delete(
        `/api/posts/${postId}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) => prev.filter((com) => com._id !== commentId));
      if (openMenuId === commentId) setOpenMenuId(null);
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

  // Build nested comment structure
  const buildCommentTree = (comments) => {
    const commentMap = {};
    const rootComments = [];

    comments.forEach(comment => {
      commentMap[comment._id] = { ...comment, replies: [] };
    });

    comments.forEach(comment => {
      if (comment.parent) {
        const parentId = comment.parent._id || comment.parent;
        if (commentMap[parentId]) {
          commentMap[parentId].replies.push(commentMap[comment._id]);
        }
      } else {
        rootComments.push(commentMap[comment._id]);
      }
    });

    return rootComments;
  };

  const commentTree = buildCommentTree(comments);

  const displayedComments = showAll ? commentTree : [commentTree[highlightIndex]].filter(Boolean);

  // Render individual comment with replies (YouTube-style with enhanced visual hierarchy)
  const renderComment = (comment, isReply = false, parentComment = null, depth = 0) => {
    const commentReplies = comment.replies || [];
    const isExpanded = expandedReplies[comment._id];

    return (
      <div key={comment._id} className={`${isReply ? 'pl-0' : ''}`}>
        <div className="flex gap-1 sm:gap-2 group">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 ring-2 ring-transparent group-hover:ring-[var(--primary)] transition-all duration-200">
              {comment.user?.profilePicUrl ? (
                <ProfileAvatar user={comment.user} size={isReply ? 36 : 40} />
              ) : (
                <div className="text-sm font-semibold text-gray-600 flex items-center justify-center h-full bg-gradient-to-br from-gray-200 to-gray-300">
                  {(comment.user?.full_name || comment.user?.username || "U")[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Comment content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-sm sm:text-base font-semibold text-gray-900 hover:underline cursor-pointer transition-colors">
                {comment.user?.full_name || comment.user?.username}
              </span>
              <span className="text-xs sm:text-sm text-gray-500">
                {moment(comment.createdAt).fromNow()}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-gray-400 italic">(edited)</span>
              )}
            </div>

            {/* Edit mode */}
            {editingId === comment._id ? (
              <div className="mt-2 sm:mt-3">
                <textarea
                  value={editingText}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setEditingText(e.target.value);
                    const el = editInputRef.current;
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = Math.min(el.scrollHeight, 150) + "px";
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEditSubmit(comment._id);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  rows={1}
                  maxLength={300}
                  ref={editInputRef}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none transition-all"
                />
                <div className="flex gap-2 mt-2 sm:mt-3">
                  <button onClick={() => handleEditSubmit(comment._id)} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--primary)] text-white rounded-full text-sm hover:opacity-90 transition flex items-center gap-1.5">
                    {updatingId === comment._id ? <Loader2 size={16} className="animate-spin" /> : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition">
                    Cancel
                  </button>
                </div>
                {editError && <div className="text-red-500 text-xs mt-2">{editError}</div>}
              </div>
            ) : (
              <div className="text-[0.87rem] sm:text-[0.9rem] text-gray-800 leading-relaxed mt-2 sm:mt-2.5">
                <CommentText text={DOMPurify.sanitize(comment.text)} isEdited={comment.isEdited} maxChars={500} />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-3">
              <button className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-[var(--primary)] transition p-1.5 sm:p-2 rounded-full hover:bg-gray-100">
                <ThumbsUp size={14} sm:size={16} />
                <span className="hidden sm:inline">Like</span>
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setReplyTo(comment);
                  inputRef.current?.focus();
                }}
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-[var(--accent)] transition p-1.5 sm:p-2 rounded-full hover:bg-gray-100"
              >
                <MessageSquare size={14} sm:size={16} />
                <span className="hidden sm:inline">Reply</span>
              </button>
              {comment.user?._id === currentUser?._id && (
                <div className="relative" ref={el => menuRefs.current[comment._id] = el}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === comment._id ? null : comment._id)}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === comment._id && (
                    <div className="absolute left-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 animate-fadeIn">
                      <button
                        onClick={() => {
                          setEditingId(comment._id);
                          setEditingText(comment.text);
                          setOpenMenuId(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment._id)}
                        disabled={deletingId === comment._id}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        {deletingId === comment._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pending/Failed status */}
            {comment.pending && <div className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Posting...</div>}
            {comment.failed && (
              <div onClick={handlePost} className="text-xs text-red-500 cursor-pointer mt-2 hover:underline">
                Failed to post. Click to retry
              </div>
            )}
          </div>
        </div>

        {/* Replies section - Enhanced YouTube-style with connecting lines */}
        {commentReplies.length > 0 && (
          <div className="mt-3 sm:mt-4">
            <button
              onClick={() => toggleReplies(comment._id)}
              className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-semibold text-[var(--primary)] hover:text-[var(--accent)] transition mb-3 sm:mb-4 ml-10 sm:ml-11"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
                <CornerDownRight size={12} sm:size={14} />
              </div>
              <span className="hidden sm:inline">{isExpanded ? 'Hide' : 'View'} {commentReplies.length} {commentReplies.length === 1 ? 'reply' : 'replies'}</span>
              <span className="sm:hidden">{commentReplies.length} {commentReplies.length === 1 ? 'reply' : 'replies'}</span>
            </button>

            {isExpanded && (
              <div className="space-y-0 relative">
                {/* Enhanced vertical connecting line with gradient */}
                <div
                  className="absolute left-[22px] sm:left-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)] to-transparent"
                  style={{ opacity: 0.25 }}
                />
                {commentReplies.map((reply, index) => (
                  <div key={reply._id} className="relative pl-10 sm:pl-11 py-3 sm:py-4">
                    {/* Enhanced horizontal connector with dot */}
                    <div className="absolute left-[18px] sm:left-[19px] top-5 sm:top-6 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border-2 border-[var(--primary)] z-10 shadow-sm" />

                    {/* Vertical line segment with enhanced styling */}
                    {index < commentReplies.length - 1 && (
                      <div className="absolute left-[22px] sm:left-[23px] top-7 sm:top-8 w-0.5 h-full bg-[var(--primary)" style={{ opacity: 0.15 }} />
                    )}

                    {/* Reply container with subtle background */}
                    <div className="rounded-lg p-2 sm:p-3 -ml-2" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.03)' }}>
                      {renderComment(reply, true, comment, depth + 1)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Comments count header */}
      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
        <h3 className="text-[1rem] sm:text-[1.1rem] font-bold text-gray-900">{commentsCount || comments.length} Comments</h3>
        <button onClick={() => setShowAll(!showAll)} className="text-sm text-gray-500 hover:text-gray-700 transition">
          {showAll ? 'Collapse all' : 'Expand'}
        </button>
      </div>

      {/* Comment input */}
      <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex-shrink-0">
          <ProfileAvatar user={currentUser} size={40} />
        </div>
        <div className="flex-1">
          {replyTo && (
            <div className="flex items-center justify-between bg-gray-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-lg border-b-2 border-[var(--primary)]">
              <div className="flex items-center gap-2">
                <CornerDownRight size={14} className="text-[var(--primary)]" />
                <span className="text-xs sm:text-sm text-gray-600">
                  Replying to <strong className="text-gray-900">@{replyTo.user?.username || replyTo.user?.full_name}</strong>
                </span>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-500 transition p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= 500) setText(e.target.value);
              const el = inputRef.current;
              if (el) {
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 150) + "px";
              }
            }}
            placeholder={currentUser ? "Add a comment..." : "Sign in to comment"}
            disabled={!currentUser || posting}
            rows={1}
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePost();
              }
            }}
            className={`w-full border-2 ${replyTo ? 'border-t-0 rounded-b-lg' : 'rounded-lg'} border-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-[.86rem] sm:text-base focus:outline-none focus:border-[var(--primary)] resize-none transition-colors`}
          />
          <div className="flex justify-end gap-2 sm:gap-3 mt-2 sm:mt-3">
            {text.trim() && (
              <button onClick={() => { setText(''); setReplyTo(null); }} className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                Cancel
              </button>
            )}
            <button
              onClick={handlePost}
              disabled={!currentUser || posting || !text.trim()}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[var(--primary)] text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--btn-hover)] transition flex items-center gap-2"
            >
              {posting ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
              <span className="hidden sm:inline">Comment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-5 sm:space-y-6">
        {loading ? (
          <>
            {Array.from({ length: commentsCount || 3 }).map((_, i) => (
              <CommentSkeleton key={i} />
            ))}
          </>
        ) : displayedComments.length === 0 ? (
          <div className="text-gray-500 text-sm sm:text-base text-center py-6 sm:py-8 px-4">
            <div className="mb-2">
              <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto opacity-30" />
            </div>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          displayedComments.map((comment) => renderComment(comment))
        )}
      </div>

      {alert.open && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ ...alert, open: false })}
        />
      )}
    </div>
  );
}
