// src/component/LikeButton.jsx
import React, { useState } from "react";
import { Heart as HeartOutline } from "lucide-react";
import { FaHeart, FaUsers } from "react-icons/fa";
import axiosBase from "../utils/axiosBase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LikeButton = ({ post, onShowLikes }) => {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const userId = user?._id;

  const initialLiked = Array.isArray(post.recentReactions)
    ? post.recentReactions.some((r) => {
        const ru = r.user;
        return (
          ru?._id?.toString() === userId?.toString() ||
          ru?.toString() === userId?.toString()
        );
      })
    : false;

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(
    post.likesCount ?? post.recentReactions?.length ?? 0
  );
  const [loading, setLoading] = useState(false);

  const toggleLike = async () => {
    if (!userId) return navigate("/signin");
    if (loading) return;
    setLoading(true);

    const prevLiked = liked;
    const prevCount = likesCount;

    // optimistic
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await axiosBase.put(`api/posts/${post._id}/like`);
      if (res?.data?.post?.likesCount != null) {
        setLikesCount(res.data.post.likesCount);
      }
      if (typeof res.data.liked === "boolean") {
        setLiked(res.data.liked);
      }
    } catch (err) {
      // rollback
      setLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center gap-1">
      {/* LIKE BUTTON */}
      <div
        onClick={toggleLike}
        className={`flex items-center cursor-pointer ${
          loading ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {liked ? (
          <FaHeart className="text-red-500 w-5 h-5 scale-110" />
        ) : (
          <HeartOutline className="text-primary w-5 h-5" />
        )}
      </div>

      {/* SHOW WHO LIKED */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onShowLikes(post._id);
        }}
        className="flex items-center justify-center mt-4 w-4 h-4 bg-gray-400 rounded-full hover:bg-primary transition cursor-pointer"
      >
        <FaUsers className="text-white w-3 h-3" />
      </div>

      {/* COUNT */}
      <span className="text-sm font-medium">{likesCount}</span>
    </div>
  );
};

export default LikeButton;
