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
  <div className="p-4 grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full">
    {post.attachments.map((file, i) => (
      <div
        key={i}
        onClick={() => {
          if (file.type === "image") {
            setViewerMediaIndex(i);
            setViewerOpen(true);
          }
        }}
        className="cursor-pointer w-full"
      >
        {file.type === "image" && (
          <div className="w-full overflow-hidden rounded-md bg-gray-100">
            <img
              src={file.url}
              alt={`attachment-${i}`}
              className="w-full h-auto object-contain"
            />
          </div>
        )}
        {file.type === "video" && (
          <div className="w-full rounded-md overflow-hidden">
            <VideoPlayer
              src={file.url}
              poster={file.poster}
              maxHeight="480px"
              autoPlayOnView={false} // optional, prevent autoplay here
            />
          </div>
        )}
      </div>
    ))}
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
