// src/component/PostCard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  BadgeCheck,
  Heart as HeartOutline,
  Share2,
  MessageCircle,
  X,
  MoreVertical,
} from "lucide-react";
import { FaHeart, FaUsers } from "react-icons/fa";
import moment from "moment";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";
import MediaViewer from "./shared/MediaViewer";
import axiosBase from "../utils/axiosBase";
import CommentSection from "./CommentSection";
import ShareModal from "./ShareModal";
import CustomAlert from "./shared/CustomAlert";
import ProfileAvatar from "./shared/ProfileAvatar"
import UserActionMenu from "./shared/UserActionMenu";
import VideoPlayer from "./shared/VideoPlayer";
import DislikeButton from "./DislikeButton";
import ActionNotifier from "./shared/ActionNotifier";
import Loading from "./shared/Loading";

const PostCard = ({   post,
  setFeeds,
  onShare,
  onImageClick,
  onHeaderClick,
  showAlert }) => {
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth() || {};
  const userId = currentUser?._id;

  if (!post) return null;

  const [isFollowing, setIsFollowing] = useState(() => {
    if (!currentUser || !currentUser.following) return false;
    return currentUser.following.map(String).includes(String(post.user?._id));
  });

  const [isBlocked, setIsBlocked] = useState(() => {
    if (!currentUser || !currentUser.blockedUsers) return false;
    return currentUser.blockedUsers.map(String).includes(String(post.user?._id));
  });

  const initialLiked = (() => {
    if (!userId) return false;
    if (Array.isArray(post.recentReactions)) {
      return post.recentReactions.some((r) => {
        const ru = r.user;
        return (
          (ru && ru._id?.toString?.() === userId?.toString?.()) ||
          ru?.toString?.() === userId?.toString?.()
        );
      });
    }
    return false;
  })();

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? post.recentReactions?.length ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showCommentsSection, setShowCommentsSection] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount ?? post.comments_count ?? 0);
    const [deleting, setDeleting] = useState(false);
  // ---------------- DISLIKE STATES ----------------
const initialDisliked = (() => {
  if (!userId) return false;
  if (Array.isArray(post.recentDislikes)) {
    return post.recentDislikes.some((r) => {
      const ru = r.user;
      return (
        (ru && ru._id?.toString?.() === userId?.toString?.()) ||
        ru?.toString?.() === userId?.toString?.()
      );
    });
  }
  return false;
})();

const [disliked, setDisliked] = useState(initialDisliked);
const [dislikesCount, setDislikesCount] = useState(
  post.dislikesCount ?? 0 
);



  const [showConfirm, setShowConfirm] = React.useState(false);


  const [showLikesBar, setShowLikesBar] = useState(false);
  const [likesList, setLikesList] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const likeBarRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isOwnPost = String(post.user?._id) === String(userId);

  const highlightHashtags = (text) =>
    text?.replace(/(#\w+)/g, `<span style="color:var(--primary)">$1</span>`) || "";

  const maxLength = 200;
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = post.content && post.content.length > maxLength;
  const contentToShow = isExpanded || !shouldTruncate ? post.content : post.content.slice(0, maxLength) + "...";
  const displayContent = DOMPurify.sanitize(highlightHashtags(contentToShow));
  function linkify(text) {
  if (!text) return "";

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.replace(urlRegex, (url) => {
    return `<a 
      href="${url}" 
      target="_blank" 
      rel="noopener noreferrer"
      class="text-[var(--primary)] no-underline break-words"
    >
      ${url}
    </a>`;
  });
}
const processedContent = linkify(displayContent);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (likeBarRef.current && !likeBarRef.current.contains(e.target)) setShowLikesBar(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const handleLike = async () => {
  if (!userId) return navigate("/signin");
  if (likeLoading) return;
  setLikeLoading(true);

  // save previous state for rollback
  const prevLiked = liked;
  const prevLikes = likesCount;
  const prevDisliked = disliked;
  const prevDislikes = dislikesCount;

  // optimistic update: toggle like and remove dislike if present
  const willLike = !prevLiked;
  setLiked(willLike);
  setLikesCount(willLike ? prevLikes + 1 : Math.max(0, prevLikes - 1));

  if (prevDisliked && willLike) {
    setDisliked(false);
    setDislikesCount(Math.max(0, prevDislikes - 1));
  }

  try {
    const res = await axiosBase.put(`/api/posts/${post._id}/like`);
    const serverPost = res.data?.post;
    if (serverPost) {
      console.log("Received updated post from server:", serverPost);
      // authoritative reconciliation
      setLikesCount(serverPost.likesCount ?? likesCount);
      setDislikesCount(serverPost.dislikesCount ?? dislikesCount);

      const meLiked = (serverPost.recentReactions || []).some(
        (r) => r.type === "like" && r.user?._id?.toString() === userId?.toString()
      );
const meDisliked = (serverPost.recentDislikes || []).some(
  (r) =>
    (r.user?._id?.toString() === userId?.toString()) ||
    (r.user?.toString?.() === userId?.toString())
);


      setLiked(!!meLiked);
      setDisliked(!!meDisliked);
    } 
  } catch (err) {
    // rollback
    setLiked(prevLiked);
    setLikesCount(prevLikes);
    setDisliked(prevDisliked);
    setDislikesCount(prevDislikes);
    console.error("Failed to like post", err);
    showAlert?.("Failed to like post. Try again.", "error");
  } finally {
    setLikeLoading(false);
  }
};


  const onConfirmDelete = async () => {
    setShowConfirm(false); // hide the notifier
    setDeleting(true);

    try {
      const res = await axiosBase.delete(`api/posts/${post._id}`);
      showAlert("Post deleted successfully", "success");

      // OPTIONAL: Refresh page or remove post from UI
      setFeeds((prevFeeds) =>
        prevFeeds.filter(
          (p) => String(p._id) !== String(post._id)
        )
      );
    } catch (err) {
      showAlert("Failed to delete post. Try again.", "error");
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  };

  const onCancelDelete = () => {
    setShowConfirm(false);
  };

  const handleDeletePost = async () => {
    if (!userId) return navigate("/signin");

    // Show the custom confirmation notifier
    setShowConfirm(true);
  };



  const handleShowLikes = async (postId) => {
    setShowLikesBar(true);
    setLoadingLikes(true);
    setLikesList([]);

    try {
      const res = await axiosBase.get(`api/posts/${postId}/likes`);
      setLikesList(res.data.likes || []);
    } catch {
      showAlert("Failed to fetch likes.", "error");
    } finally {
      setLoadingLikes(false);
    }
  };



  const handleFollow = async () => {
    if (!userId) return navigate("/signin");
    if (isOwnPost) return;

    try {
      const res = await axiosBase.post(`api/user/${post.user._id}/follow`);
      setIsFollowing((prev) => !prev);
      showAlert(res?.data?.message || (isFollowing ? "Unfollowed user." : "Followed user."), "success");
    } catch {
      showAlert("Failed to update following. Try again.", "error");
    } finally {
      setMenuOpen(false);
    }
  };

  const handleBlock = async () => {
    if (!userId) return navigate("/signin");
    if (isOwnPost) return;

    const ok = window.confirm(`Are you sure you want to ${isBlocked ? "unblock" : "block"} ${post.user?.full_name || "this user"}?`);
    if (!ok) { setMenuOpen(false); return; }

    try {
      await axiosBase.put(`api/user/block?userId=${userId}&id=${post.user._id}`);
      setIsBlocked((prev) => !prev);
      if (!isBlocked) setIsFollowing(false);
      showAlert(isBlocked ? "User unblocked." : "User blocked.", "success");
    } catch {
      showAlert("Failed to block/unblock user. Try again.", "error");
    } finally {
      setMenuOpen(false);
    }
  };




  return (
    <div className="bg-white rounded-xl shadow p-2 py-3 space-y-4 w-full max-w-3xl mx-auto relative">

      {/* Header */}
      {/* Header */}
      <div className="flex justify-between items-center w-full ">
        {/* LEFT: user details */}
        <div
            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              onDoubleClick={onHeaderClick}  >
          <div onClick={() => navigate(`/profile/${post.user?._id}`)}>
            <ProfileAvatar

              user={{
                name: post.user?.name || "User",
                profilePicUrl: post.user?.profilePicUrl,
                profilePicBackground: post.user?.profilePicBackground,
              }}
              size={48}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1 text-sm truncate">
              <span className="font-semibold truncate">
                {post.user?.full_name}
              </span>
              <BadgeCheck
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "var(--primary)" }}
              />
            </div>
            <div className="flex flex-col text-xs text-gray-500 truncate">
              @{post.user?.username}
              <p className="text-[11px] mt-1 font-light">
                {moment(post.createdAt).fromNow()}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: ... menu */}
        <UserActionMenu
          isOwnPost={isOwnPost}
          isFollowing={isFollowing}
          isBlocked={isBlocked}
          handleFollow={handleFollow}
          handleBlock={handleBlock}
          handleDeletePost={handleDeletePost}
        />
      </div>



      {/* Content */}
 {post.content && (
  <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
    <div dangerouslySetInnerHTML={{ __html: processedContent }} />
    {shouldTruncate && (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-[var(--primary)] mt-1 inline-block"
      >
        {isExpanded ? "Read Less" : "Read More"}
      </button>
    )}
  </div>
)}


      {/* Attachments */}
      {post.attachments?.length > 0 && (
        <div
          className={`w-full flex flex-wrap justify-center gap-2 ${post.attachments.length === 3 ? "three-layout" : ""
            } ${post.attachments.length === 2 ? "max-w-[800px] mx-auto" : ""}`} // center and constrain width
        >

          {post.attachments.map((file, index) => {
            const count = post.attachments.length;
            const single = count === 1;
            const isVideo = file.type === "video";
            const isImage = file.type === "image";
            const isYouTube = file.type === "youtube";

            // ✅ Detect tall (portrait) mobile-shaped image
            const isMobileShaped =
              isImage && file?.aspect === "tall" && !single;

            // ✅ Dynamic height for each type
            const maxHeight = single
              ? "450px"
              : isMobileShaped
                ? "1100px"
                : "800px";

            // ✅ Dynamic aspect ratio
            const aspectRatio = single
              ? "auto"
              : isMobileShaped
                ? "3/5"
                : "5/3";

            // ✅ Responsive width logic
            let widthClass = "w-full";
            if (count === 2) {
              widthClass = "w-1/2"; // ✅ always side-by-side
            } else if (count === 3) {
              widthClass =
                index < 2
                  ? "w-1/2"
                  : "w-full lg:w-[70%] mx-auto"; // last one centered
            } else if (count === 4) {
              widthClass = "w-1/2"; // 2x2 grid
            }


            return (
              <div
                key={index}
onClick={(e) => {
  e.stopPropagation();
  if (isImage) onImageClick(index);
}}
                className={`relative cursor-pointer overflow-hidden ${widthClass} ${single ? "rounded-lg" : "rounded-sm"
                  } bg-gray-100`}
                style={{
                  aspectRatio,
                  marginInline: single ? "auto" : 0,
                }}
              >
                {/* ✅ IMAGE */}
                {isImage && (
                  <img
                    src={file.url}
                    alt={`attachment-${index}`}
                    className={`w-full h-full ${file?.aspect === "tall"
                        ? "object-contain"
                        : "object-cover"
                      } rounded-md`}
                    style={{
                      objectFit: "contain",
                      maxHeight,
                      width: isMobileShaped ? "75%" : "100%",
                      margin: "auto",
                      userSelect: "none",
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />
                )}

                {/* ✅ VIDEO */}
                {/* ✅ CUSTOM VIDEO */}
                {isVideo && (
                  <div
                    key={index}
                    onClick={(e) => {
                      if (isVideo || isYouTube) return; // 🚀 stop viewer for videos
                      // setViewerOpen(true);
                      // setViewerIndex(index);
                      // setSelectedMediaIndex(index);
                      setCurrentPost(post)
                      console.log("this is the new selelcted index", index)
                      console.log(post)
                    }}
                    className={`relative cursor-pointer overflow-hidden ${widthClass} ${single ? "rounded-lg" : "rounded-sm"
                      } bg-gray-100`}
                    style={{
                      aspectRatio,
                      marginInline: single ? "auto" : 0,
                    }}
                  >
                    <VideoPlayer
                      src={file.url}
                      poster={file.poster || ""}
                      maxHeight={maxHeight}
                      primaryColor="#FF4D4F" // your theme color
                      autoPlayOnView={true}
                      sectionId="feed-1"
                    />
                  </div>
                )}



                {/* ✅ YOUTUBE */}
                {isYouTube && (
                  <iframe
                    src={`https://www.youtube.com/embed/${file.youtubeId}`}
                    title={`youtube-${index}`}
                    className="w-full h-full rounded-md"
                    allowFullScreen
                    style={{ maxHeight }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}







      {/* {viewerOpen && <MediaViewer post={post} initialIndex={viewerIndex} onClose={() => setViewerOpen(false)} />} */}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-gray-200">

        {/* Like */}
        <div className="relative flex items-center gap-1"> {/* increased gap */}
          {/* Like Button */}
          <div
            onClick={handleLike}
            className={`flex items-center cursor-pointer relative ${likeLoading ? "opacity-50 pointer-events-none" : ""}`}
          >
            {liked ? (
              <FaHeart className="text-red-500 w-5 h-5 transition-transform transform scale-110" />
            ) : (
              <HeartOutline className="text-primary w-5 h-5 transition-transform" />
            )}
          </div>

          {/* People who liked (moved outside & spaced) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleShowLikes(post._id);
            }}
            className="flex items-center justify-center mt-4 w-4 h-4 bg-gray-400 rounded-full hover:bg-primary transition"
          >
            <FaUsers className="text-white w-3 h-3" />
          </div>

          {/* Likes Count */}
          <span className="text-sm font-medium">{likesCount}</span>
        </div>

<DislikeButton
  postId={post._id}
  post={post}
  onToggle={(payload) => {
  const serverPost = payload?.post || payload;
  if (!serverPost) return;

  setLikesCount(serverPost.likesCount);
  setDislikesCount(serverPost.dislikesCount);

  const meLiked = serverPost.recentReactions?.some(
    (r) => r.user?._id?.toString() === userId?.toString()
  );

 const meDisliked = (serverPost.recentDislikes || []).some(
  (r) =>
    (r.user?._id?.toString() === userId?.toString()) ||
    (r.user?.toString?.() === userId?.toString())
);

  setLiked(meLiked);
  setDisliked(meDisliked);
}}
disliked={disliked}
setDisliked={setDisliked}
dislikesCount={dislikesCount}
setDislikesCount={setDislikesCount}


/>



        {/* Comment */}
        <div onClick={() => setShowCommentsSection((s) => !s)} className="flex items-center gap-1 cursor-pointer text-sm text-gray-700">
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">{commentsCount}</span>
        </div>

        {/* Share */}
        <button onClick={(e) => { e.stopPropagation(); onShare() }} className="flex items-center gap-1 text-sm text-gray-700">
          <Share2 className="w-5 h-5" />
          <span className="font-medium">{post.sharesCount}</span>
        </button>
      </div>


      {showCommentsSection && <CommentSection postId={post._id} onCommentAdded={() => setCommentsCount((c) => c + 1)} />}
      {showConfirm && (<ActionNotifier action="delete this post" onConfirm={onConfirmDelete} onCancel={onCancelDelete} />)}
       {deleting && <Loading text="Deleting post..." />}


      {/* Likes popup */}
      {showLikesBar && (
        <div ref={likeBarRef} className="absolute bg-white shadow-lg rounded-2xl border border-gray-200 p-4 z-50 w-72 max-h-72 overflow-y-auto bottom-16 right-2 transition-all duration-300">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-700 text-sm">People who liked this</h4>
            <X onClick={() => setShowLikesBar(false)} className="w-4 h-4 cursor-pointer text-gray-500" />
          </div>
          {loadingLikes ? (
            <div className="flex flex-col items-center justify-center py-6 text-gray-500">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
              <p className="text-sm">Loading likes...</p>
            </div>
          ) : likesList.length === 0 ? (
            <p className="text-gray-500 text-sm">No likes yet.</p>
          ) : (
            likesList.map((l, idx) => (
              <div key={idx} onClick={() => navigate(`/profile/${l._id}`)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                {l.profilePicUrl ? <img src={l.profilePicUrl} alt={l.full_name} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-medium">{l.full_name?.charAt(0)?.toUpperCase()}</div>}
                <div className="truncate">
                  <p className="text-sm font-medium truncate">{l.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">@{l.username}</p>
                  {l.occupation && <small className="text-xs text-gray-500 truncate">{l.occupation}</small>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;