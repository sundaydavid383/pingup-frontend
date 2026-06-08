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
import VoiceNoteCard from "./shared/VoiceNoteCard";
import { useGlobalVideo } from "../context/GlobalVideoContext";
import "../styles/postcard.css";
import SharedBanner from "./SharedBanner";


const PostCard = ({ post,
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
  const audioRefs = useRef({});
  const isOwnPost = String(post.user?._id) === String(userId);

  const highlightHashtags = (text) =>
    text?.replace(/(#\w+)/g, `<span style="color:var(--primary)">$1</span>`) || "";

const maxLength = 280;           // fallback
const maxParagraphs = 2;         // LinkedIn usually shows ~2 paragraphs

const [isExpanded, setIsExpanded] = useState(false);

// Helper functions
const truncateByParagraphs = (text) => {
  if (!text) return "";
  
  // Split into paragraphs (handles both \n\n and single \n)
  const paragraphs = text.split(/\n\s*\n/);
  
  if (paragraphs.length <= maxParagraphs) return text;
  
  return paragraphs.slice(0, maxParagraphs).join('\n\n');
};

const getTruncatedContent = (content) => {
  if (!content) return "";

  let truncated = truncateByParagraphs(content);

  // Fallback: hard character limit
  if (truncated.length > maxLength) {
    truncated = truncated.slice(0, maxLength).trim() + "...";
  }

  return truncated;
};

// Should we show "Read More"?
const shouldTruncate = post.content && (
  post.content.split(/\n\s*\n/).length > maxParagraphs ||
  post.content.length > maxLength + 80
);

const contentToShow = isExpanded || !shouldTruncate 
  ? post.content 
  : getTruncatedContent(post.content);
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

 // 1️⃣ Detect attachment types
const hasImageAttachment = post.attachments?.some(att => att.type === "image") || false;
const hasAudioAttachment = post.attachments?.some(att => att.type === "audio") || false;


// 2️⃣ Check if the post has a mix of images + audio
//const isMixedImageAudio = hasImageAttachment && hasAudioAttachment;

// 3️⃣ Separate attachments into arrays for easier rendering
const audioAttachments = post.attachments?.filter(att => att.type === "audio") || [];
//const imageAttachments = post.attachments?.filter(att => att.type === "image") || [];
//const videoAttachments = post.attachments?.filter(att => att.type === "video") || [];
const youtubeAttachments = post.attachments?.filter(att => att.type === "youtube") || [];
const nonAudioAttachments = post.attachments?.filter(att => att.type !== "audio") || [];

// 4️⃣ Check for YouTube data (supports multiple backend formats)
const hasYouTube = !!(
  post.youtubeVideoId ||
  post.youtubeEmbedUrl ||
  youtubeAttachments.length > 0 ||
  post.youtubeVideo?.videoId
);

// 5️⃣ Get YouTube embed URL from multiple possible sources
const getYouTubeEmbedUrl = (post) => {
  // 1. Check for pre-processed embed URL
  if (post.youtubeEmbedUrl) return post.youtubeEmbedUrl;
  
  // 2. Check for YouTube video ID
  if (post.youtubeVideoId) {
    return `https://www.youtube.com/embed/${post.youtubeVideoId}?playsinline=1`;
  }
  
  // 3. Check nested YouTube object
  if (post.youtubeVideo?.embedUrl) return post.youtubeVideo.embedUrl;
  if (post.youtubeVideo?.videoId) {
    return `https://www.youtube.com/embed/${post.youtubeVideo.videoId}?playsinline=1`;
  }
  
  // 4. Check if text contains YouTube URL and convert to embed
  const text = post.text || post.content || '';
  const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = text.match(youtubeRegex);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?playsinline=1`;
  }
  
  return null;
};

const youTubeUrl = getYouTubeEmbedUrl(post);

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

  console.log("POST ATTACHMENTS:", JSON.stringify(post.attachments, null, 2));



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


  const hasVideoAttachment = post.attachments?.some(
    (file) => file.type === "video" || file.type === "youtube"
  )

  console.log("ATTACHMENTS FOR POST", post._id, ":", post.attachments?.map(a => a.type));

return (
    <div className="pc-root space-y-0" style={{ overflow: "visible", position: "relative" }}>

      <SharedBanner sharedBy={post.sharedForMe ? post.sharedBy : null} />
      {/* Header */}
      <div className="pc-header">
        <div className="pc-author" onDoubleClick={onHeaderClick}>
          <div className="pc-avatar-wrap" onClick={() => navigate(`/profile/${post.user?._id}`)}>
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
            <div className="flex items-center gap-1 truncate">
              <span className="pc-author-name">{post.user?.full_name}</span>
              <BadgeCheck className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
            </div>
            <div className="pc-author-handle">
              @{post.user?.username}
              <p className="pc-author-time">{moment(post.createdAt).fromNow()}</p>
            </div>
          </div>
        </div>

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
        <div className="pc-content">
          <div dangerouslySetInnerHTML={{ __html: processedContent }} />
          {shouldTruncate && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="pc-read-more">
              {isExpanded ? "Read Less" : "Read More"}
            </button>
          )}
        </div>
      )}

      {/* YouTube Video - standalone fields */}
      {hasYouTube && youTubeUrl && !post.attachments?.some(att => att.type === "youtube") && (
        <div className="pc-media-wrap" style={{ aspectRatio: "16/9" }}>
          <iframe
            src={youTubeUrl}
            title="YouTube video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            className="w-full h-full"
          />
        </div>
      )}

      {/* Audio Attachments */}
      {audioAttachments.length > 0 && audioAttachments.map((file, index) => (
        <VoiceNoteCard
          key={file.url || index}
          audioUrl={file.url}
          ref={(el) => { if (el) audioRefs.current[file.url] = el; }}
        />
      ))}

      {/* Non-audio Attachments */}
      {nonAudioAttachments?.length > 0 && (
        <div
  className={`w-full gap-2
    ${hasVideoAttachment ? "bg-black" : ""}
    ${nonAudioAttachments.length === 1 ? "block" : ""}
    ${nonAudioAttachments.length === 2 ? "grid grid-cols-2 max-w-[900px] mx-auto" : ""}
    ${nonAudioAttachments.length === 3 ? "grid grid-cols-2" : ""}
    ${nonAudioAttachments.length >= 4 ? "grid grid-cols-2" : ""}
  `}
>
          {nonAudioAttachments.map((file, index) => {
            const count = nonAudioAttachments.length;
            const single = count === 1;
            const isImage = file.type === "image";
            const isVideo = file.type === "video";
            const isYouTube = file.type === "youtube";
            const isMobileShaped = isImage && file?.aspect === "tall" && !single;
            const isLandscapeShaped = isImage && file?.aspect === "wide" && !single;
            const isPortraitVideo = isVideo && file?.aspect === "tall";
            const isLastOfThree = count === 3 && index === 2;

            let maxHeight;
            if (single) maxHeight = "500px";
            else if (count === 4) maxHeight = "450px";
            else if (count === 3) maxHeight = "400px";
            else if (isMobileShaped) maxHeight = "350px";
            else if (isLandscapeShaped) maxHeight = "350px";
            else maxHeight = "450px";

            let widthClass = "w-full";
            if (count === 2) widthClass = "w-1/2";
            else if (count === 3) widthClass = index < 2 ? "w-1/2" : "w-full lg:w-[70%] mx-auto";
            else if (count === 4) widthClass = "w-1/2";

            let portraitWidthClass = "";
            if (isPortraitVideo) {
              portraitWidthClass = single ? "max-w-[420px] mx-auto" : "max-w-[380px] mx-auto";
            }

            return (
              <div
  key={index}
  onClick={(e) => { e.stopPropagation(); if (isImage) onImageClick(index); }}
  className={`relative cursor-pointer
    ${isVideo ? "overflow-hidden" : ""}
    ${isYouTube ? "" : "overflow-hidden"}
    ${isVideo || isYouTube ? "bg-black" : "bg-gray-100"}
    ${single ? "rounded-xl" : "rounded-md"}
    ${isLastOfThree ? "col-span-2 mx-auto max-w-[70%]" : ""}
    ${portraitWidthClass}
  `}
  style={{}}
>
                {isImage && (
                  <img
                    src={file.url}
                    alt={`attachment-${index}`}
                    className={`w-full h-full rounded-md ${isMobileShaped ? "object-contain" : "object-cover"}`}
                    style={{ maxHeight, width: "auto", maxWidth: "100%", height: "auto", margin: "auto", userSelect: "none" }}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                )}

                {isVideo && (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <VideoPlayer
                      src={file.url}
                      poster={file.poster || ""}
                      className={`w-full ${isPortraitVideo ? "max-w-[420px] mx-auto" : "max-w-full"} h-auto object-contain`}
                      primaryColor="#FF4D4F"
                      autoPlayOnView={true}
                      sectionId={`feed-${post._id}`}
                      
                    />
                  </div>
                )}

{isYouTube && (
  <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", height: 0, borderRadius: "8px", overflow: "hidden" }}>
    <iframe
      src={file.embedUrl || file.url || `https://www.youtube.com/embed/${file.youtubeId}?rel=0&modestbranding=1`}
      title={`youtube-${index}`}
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  </div>
)}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="pc-divider" />
      <div className="pc-actions">

        {/* Like group */}
        <div className="relative flex items-center">
          <div
            onClick={handleLike}
            className={`pc-action ${liked ? "liked" : ""} ${likeLoading ? "opacity-50 pointer-events-none" : ""}`}
          >
            {liked ? (
              <FaHeart className="w-4 h-4 pc-like-icon-active" />
            ) : (
              <HeartOutline className="w-4 h-4" />
            )}
            <span className="pc-action-count">{likesCount}</span>
          </div>

          {/* People who liked */}
          <div
            onClick={(e) => { e.stopPropagation(); handleShowLikes(post._id); }}
            className="pc-likes-peek"
          >
            <FaUsers className="w-3 h-3 text-gray-500" />
          </div>
        </div>

        {/* Dislike */}
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
        <div
          onClick={() => setShowCommentsSection((s) => !s)}
          className={`pc-action ${showCommentsSection ? "liked" : ""}`}
          style={showCommentsSection ? { color: "var(--primary)", background: "rgba(var(--primary-rgb),0.07)", borderColor: "rgba(var(--primary-rgb),0.2)" } : {}}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="pc-action-count">{commentsCount}</span>
        </div>

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          className="pc-action"
        >
          <Share2 className="w-4 h-4" />
          <span className="pc-action-count">{post.sharesCount}</span>
        </button>
      </div>

      {/* Comment section */}
      {showCommentsSection && (
        <div className="pc-comments-enter">
          <CommentSection
            commentsCount={commentsCount}
            postId={post._id}
            onCommentAdded={() => setCommentsCount((c) => c + 1)}
          />
        </div>
      )}

      {showConfirm && (
        <ActionNotifier action="delete this post" onConfirm={onConfirmDelete} onCancel={onCancelDelete} />
      )}
      {deleting && <Loading text="Deleting post..." />}

      {/* Likes popup */}
      {showLikesBar && (
        <div ref={likeBarRef} className="pc-likes-popup">
          <div className="pc-likes-popup-header">
            <h4 className="pc-likes-popup-title">People who liked this</h4>
            <button className="pc-likes-popup-close" onClick={() => setShowLikesBar(false)}>
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>

          {loadingLikes ? (
            <div className="flex flex-col items-center justify-center py-6 text-gray-500">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2" />
              <p className="text-sm">Loading likes...</p>
            </div>
          ) : likesList.length === 0 ? (
            <p className="text-gray-500 text-sm">No likes yet.</p>
          ) : (
            likesList.map((l, idx) => (
              <div key={idx} onClick={() => navigate(`/profile/${l._id}`)} className="pc-likes-popup-item">
                {l.profilePicUrl
                  ? <img src={l.profilePicUrl} alt={l.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">{l.full_name?.charAt(0)?.toUpperCase()}</div>
                }
                <div className="truncate">
                  <p className="pc-likes-popup-name truncate">{l.full_name}</p>
                  <p className="pc-likes-popup-handle truncate">@{l.username}</p>
                  {l.occupation && <small className="pc-likes-popup-handle truncate">{l.occupation}</small>}
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