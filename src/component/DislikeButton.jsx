import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { FaThumbsDown } from "react-icons/fa";
import { ThumbsDown as ThumbDownOutline } from "lucide-react";
import axiosBase from "../utils/axiosBase";
import { useNavigate } from "react-router-dom";

const DislikeButton = ({ 
  postId, post, onToggle,
   disliked, setDisliked, dislikesCount,
    setDislikesCount }) => {
  const { user: currentUser } = useAuth() || {};
  const userId = currentUser?._id;
  const navigate = useNavigate();

  // const [disliked, setDisliked] = useState(false);
  // const [count, setCount] = useState(post?.dislikesCount ?? 0);
  const [loading, setLoading] = useState(false);

  // On mount or when `post` changes, check if current user has disliked
  useEffect(() => {
    if (!post || !userId) return;

    const userHasDisliked = post.recentDislikes?.some(
      (r) => r.user?._id?.toString() === userId?.toString()
    );
if (typeof setDisliked === "function") {
  setDisliked(!!userHasDisliked);
}

if (typeof setDislikesCount === "function") {
  setDislikesCount(post.dislikesCount ?? 0);
}

  }, [post, userId]);

const handleToggleDislike = async () => {
  if (!userId) return navigate("/signin");
  if (loading) return;

  setLoading(true);

  // optimistic UI only for the icon, not the count
  const prevDisliked = disliked;
  setDisliked(!prevDisliked);

  try {
    const res = await axiosBase.put(`/api/posts/${postId}/dislike`);
    const updatedPost = res?.data?.post;

    if (updatedPost) {
      // server is the ONLY truth
      setDisliked(updatedPost.recentDislikes?.some(r => r.user?._id === userId));
      setDislikesCount(updatedPost.dislikesCount);

      if (onToggle) onToggle({ post: updatedPost, meta: res.data });
    }
  } catch (err) {
    // rollback
    setDisliked(prevDisliked);
    console.error("Failed to toggle dislike", err);
  } finally {
    setLoading(false);
  }
};



  return (
    <div
      onClick={handleToggleDislike}
      className={`flex items-center gap-1 cursor-pointer ${loading ? "opacity-50 pointer-events-none" : ""}`}
    >
      {disliked ? (
        <FaThumbsDown className="text-black-500 w-5 h-5 transition-transform transform scale-110" />
      ) : (
        <ThumbDownOutline className="text-gray-600 w-5 h-5 transition-transform" />
      )}
      <span className="text-sm font-medium">{dislikesCount}</span>
    </div>
  );
};

export default DislikeButton;
