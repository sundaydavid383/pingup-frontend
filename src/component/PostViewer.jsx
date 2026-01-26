import React, { useState, useEffect, useRef } from "react";
import ProfileAvatar from "./shared/ProfileAvatar";
import MediaViewer from "./shared/MediaViewer";
import axiosBase from "../utils/axiosBase";
import CommentSection from "./CommentSection";
import ShareModal from "./ShareModal";
import CustomAlert from "./shared/CustomAlert";
import UserActionMenu from "./shared/UserActionMenu";
import VideoPlayer from "./shared/VideoPlayer";
import DislikeButton from "./DislikeButton";
import ActionNotifier from "./shared/ActionNotifier";
import "../styles/sliderButtons.css";
import { MessageCircle, Share2 } from "lucide-react";
import moment from "moment";

const PostViewer = ({ feed, currentIndex, onClose, onNavigate, currentUser }) => {
  const [index, setIndex] = useState(currentIndex);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerMediaIndex, setViewerMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "info" });
  const [showConfirm, setShowConfirm] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");


  const userId = currentUser?._id;

  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  if (!feed || feed.length === 0) return null;

  const post = feed[index];
  const isOwnPost = String(post.user?._id) === String(userId);

  const goNext = () => {
    if (index < feed.length - 1) {
       setSlideDirection("slide-left");
      setIndex(index + 1);
      onNavigate && onNavigate(index + 1);
    }
  };

  const goPrev = () => {
    if (index > 0) {
       setSlideDirection("slide-right");
      setIndex(index - 1);
      onNavigate && onNavigate(index - 1);
    }
  };

  const showAlertMsg = (message, type = "info") =>
    setAlert({ show: true, message, type });

  const onConfirmDelete = async () => {
    setShowConfirm(false);
    try {
      await axiosBase.delete(`api/posts/${post._id}`);
      showAlertMsg("Post deleted successfully", "success");
      feed.splice(index, 1);
      onNavigate && onNavigate(Math.max(0, index - 1));
    } catch (err) {
      showAlertMsg("Failed to delete post. Try again.", "error");
    }
  };

  const onCancelDelete = () => setShowConfirm(false);

  return (
<div className="fixed inset-0 z-588880 bg-black/70 backdrop-blur flex items-center justify-center p-4">
  <div className="bg-[var(--white)] rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-lg">
    <div className="overflow-y-auto"><button
  onClick={goPrev}
  disabled={index === 0}
  className="nav-btn nav-btn-prev"
>
  ‹
</button>

<button
  onClick={goNext}
  disabled={index === feed.length - 1}
  className="nav-btn nav-btn-next"
>
  ›
</button>

<button className="close-btn" onClick={onClose}>×</button>

  

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              user={{
                name: post.user?.name || "User",
                profilePicUrl: post.user?.profilePicUrl,
                profilePicBackground: post.user?.profilePicBackground,
              }}
              size={48}
            />
            <div className="flex flex-col">
              <span className="font-semibold">{post.user?.full_name}</span>
              <span className="text-xs text-gray-500">
                @{post.user?.username} • {moment(post.createdAt).fromNow()}
              </span>
            </div>
          </div>
          <UserActionMenu
            isOwnPost={isOwnPost}
            handleDeletePost={() => setShowConfirm(true)}
            // Optional: handleFollow/handleBlock can be passed here if needed
          />
        </div>

        {/* Content */}
        {post.content && (
          <div className="p-4 text-gray-800 whitespace-pre-line">
            {post.content}
          </div>
        )}

        {/* Attachments */}
  {post.attachments?.length > 0 && (
  <div
    className={`w-full grid gap-2
      ${post.attachments.length === 1 && "flex justify-center"}
      ${post.attachments.length === 2 && "grid-cols-2 max-w-[900px] mx-auto"}
      ${post.attachments.length === 3 && "grid-cols-2"}
      ${post.attachments.length >= 4 && "grid-cols-2"}
    `}
  >
    {post.attachments.map((file, index) => {
      const count = post.attachments.length;
      const single = count === 1;

      const isImage = file.type === "image";
      const isVideo = file.type === "video";
      const isYouTube = file.type === "youtube";

      // ✅ Detect portrait / mobile-shaped images
      const isMobileShaped = isImage && file?.aspect === "tall" && !single;

      // ✅ Special case: last item in 3 attachments
      const isLastOfThree = count === 3 && index === 2;

      // ✅ Dynamic max height (GRID SAFE)
      let maxHeight;
    
if (single) {
  maxHeight = "450px"; // 1 image
} else if (count === 4) {
  maxHeight = "520px"; // 2x2 grid
} else if (count === 3) {
  maxHeight = 520; // 🔥 same as 4-image logic for balance
} else if (isMobileShaped) {
  maxHeight = "1000px"; // tall portrait
} else {
  maxHeight = "750px"; // landscape
}

let widthClass = "w-full";
if (count === 2) {
  widthClass = "w-1/2"; // 2 side-by-side
} else if (count === 3) {
  widthClass = index < 2 ? "w-1/2" : "w-full lg:w-[70%] mx-auto"; // last one centered
} else if (count === 4) {
  widthClass = "w-1/2"; // 2x2 grid
}


      // ✅ Aspect ratio (controls shape, not image)
    const aspectRatio = single
  ? "auto"
  : isMobileShaped
    ? "3 / 5"
    : count === 4 || count === 3
      ? "4 / 5"  
      : "5 / 3";


      return (
<div
  key={index}
  onClick={(e) => {
    e.stopPropagation();
    if (isImage) onImageClick(index);
  }}
  className={`relative overflow-hidden cursor-pointer
    ${isVideo || isYouTube ? "bg-black" : "bg-gray-100"}
    ${single ? "rounded-lg" : "rounded-sm"}
    ${isLastOfThree ? "col-span-2 mx-auto max-w-[70%]" : ""}
  `}
  style={{ aspectRatio }}
>

          {/* ✅ IMAGE */}
          {isImage && (
          <img
  src={file.url}
  alt={`attachment-${index}`}
  className={`w-full h-full rounded-md ${isMobileShaped ? "object-contain" : "object-cover"}`}
  style={{
    maxHeight,
    width: isMobileShaped || count === 3 && index === 2 ? "auto" : "100%",
    margin: "auto",
    userSelect: "none",
  }}
  draggable={false}
  onContextMenu={(e) => e.preventDefault()}
/>

          )}

          {/* ✅ VIDEO */}

{isVideo && (
  <div className="w-full h-full flex items-center justify-center bg-black">
    <VideoPlayer
      src={file.url}
      poster={file.poster || ""}
      maxHeight="90%"
      primaryColor="#FF4D4F"
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


        {viewerOpen && (
          <MediaViewer
            post={post}
            initialIndex={viewerMediaIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-gray-200 px-4 pb-4">
          
          <div
            onClick={() => setShowComments((s) => !s)}
            className="flex items-center gap-1 cursor-pointer text-sm text-gray-700"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{post.commentsCount ?? post.comments_count ?? 0}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}
            className="flex items-center gap-1 text-sm text-gray-700"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">{post.sharesCount ?? post.shared_count ?? 0}</span>
          </button>
          <DislikeButton post={post} postId={post._id} />
        </div>

        {/* Comments & Share Modal */}
        {showComments && (
          <CommentSection
            postId={post._id}
            onCommentAdded={() => {
              post.commentsCount = (post.commentsCount ?? post.comments_count ?? 0) + 1;
            }}
          />
        )}
        {showShareModal && (
          <ShareModal
            postId={post._id}
            post={post}
            onClose={() => setShowShareModal(false)}
          />
        )}
        {showConfirm && (
          <ActionNotifier
            action="delete this post"
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
          />
        )}

        {/* Alerts */}
        {alert.show && (
          <CustomAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert({ ...alert, show: false })}
          />
        )}
      </div>
    </div>
    </div>
  );
};

export default PostViewer;
