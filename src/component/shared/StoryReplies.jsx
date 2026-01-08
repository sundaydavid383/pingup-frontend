import React from "react";
import assets from "../../assets/assets";
import { Send, Loader2 } from "lucide-react";


const StoryReplies = ({
  visibleReplies,
  currentUser,
  isOwnerOrAdmin,
  justAddedReplyId,
  setShowAllReplies,
  showAllReplies,
  newReply,
  setNewReply,
  isSubmitting,
  submitReply,
  handleEditReply,
  handleDeleteReply,
  typingTimeout,
  setIsPaused,
}) => {
  return (
    <>
      {/* --- Replies Section Container --- */}
<div
  className="absolute bottom-17 left-0 right-0
   px-4 z-[9998] max-h-48 flex flex-col space-y-2
    overflow-y-auto
    bg-[var(--form-bg)]/40 m-auto max-w-[700px]
     rounded-[var(--radius)] shadow-md
      backdrop-blur-md border p-2"
>

        {visibleReplies.length > 0 ? (
          <>
            {/* --- Latest Reply always at top --- */}
            <div className="flex flex-col space-y-2">
              {visibleReplies.slice(0, 1).map((r) => {
                const isMine = String(r.userId) === String(currentUser?._id);
                return (
                  <div
                    key={r._id}
                    className={`flex items-start gap-2 bg-[var(--form-bg)] text-[var(--text-main)] p-2 rounded-[var(--radius)]
                    ${justAddedReplyId === r._id ? "reply-animate" : ""}`}
                  >
                    <img
                      src={r.profilePic || assets.defaultProfile}
                      className="w-8 h-8 rounded-full border border-[var(--primary)]"
                      alt={r.userName}
                    />
                    <div className="flex-1 relative">
                      <span className="font-semibold text-sm text-[var(--text-secondary)]">
                        {r.userName}
                      </span>
                      <p className="text-xs text-[var(--white)]">
                        {r.replyText}
                      </p>
                      {isMine && (
                        <div className="absolute top-0 right-0 flex gap-1">
                          <button
                            onClick={() => handleEditReply(r)}
                            className="text-xs text-[var(--primary)] hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReply(r)}
                            className="text-xs text-[var(--error)] hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* --- Expand Button --- */}
            {visibleReplies.length > 1 && (
              <button
                className="self-start text-xs text-[var(--white)] hover:underline transition-[var(--transition-default)] mt-1"
                onClick={() => setShowAllReplies((prev) => !prev)}
              >
                {showAllReplies
                  ? "Collapse"
                  : `View all ${visibleReplies.length} ${
                      isOwnerOrAdmin ? "replies" : "of your replies"
                    }`}
              </button>
            )}

            {/* --- Expanded Replies --- */}
            {showAllReplies && (
              <div className="flex flex-col space-y-2 mt-2">
                {visibleReplies.slice(1).map((r) => {
                  const isMine = String(r.userId) === String(currentUser?._id);
                  return (
                    <div
                      key={r._id}
                      className={`flex items-start gap-2 bg-[var(--form-bg)] text-[var(--text-main)] p-2 rounded-[var(--radius)]
                      ${justAddedReplyId === r._id ? "reply-animate" : ""}`}
                    >
                      <img
                        src={r.profilePic || assets.defaultProfile}
                        className="w-8 h-8 rounded-full border border-[var(--primary)]"
                        alt={r.userName}
                      />
                      <div className="flex-1 relative">
                        <span className="font-semibold text-sm text-[var(--primary)]">
                          {r.userName}
                        </span>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {r.replyText}
                        </p>
                        {isMine && (
                          <div className="absolute top-0 right-0 flex gap-1">
                            <button
                              onClick={() => handleEditReply(r)}
                              className="text-xs text-[var(--primary)] hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReply(r)}
                              className="text-xs text-[var(--error)] hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-[var(--text-muted)] italic">No replies yet.</p>
        )}
      </div>

      {/* --- Reply Input --- */}
      {!isOwnerOrAdmin && (
        <div className="
        absolute bottom-0 m-auto max-w-[700px] 
        left-0 right-0 px-4 py-2 z-[9999] flex items-center
         gap-2 bg-zinc-900/90 backdrop-blur-sm
         ">
          <input
            type="text"
            value={newReply}
            disabled={isSubmitting}
            onChange={(e) => {
              setNewReply(e.target.value);
              setIsPaused(true);

              if (typingTimeout.current) clearTimeout(typingTimeout.current);
              typingTimeout.current = setTimeout(() => {
                setIsPaused(false);
              }, 3000);
            }}
            onFocus={() => setIsPaused(true)}
            onBlur={() => {
              setIsPaused(false);
              if (typingTimeout.current) clearTimeout(typingTimeout.current);
            }}
            placeholder="Write a reply..."
            className={`flex-1 rounded-full px-3 py-2 ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            } bg-zinc-800 text-white placeholder:text-zinc-400 focus:outline-none`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                submitReply();
                setIsPaused(false);
                if (typingTimeout.current) clearTimeout(typingTimeout.current);
              }
            }}
          />

<button
  onClick={submitReply}
  disabled={isSubmitting}
  className={`
    flex items-center justify-center
    w-10 h-10 rounded-full
    bg-[var(--primary)]
    text-[var(--white)]
    shadow-md
    transition-all duration-200
    active:scale-90
    hover:brightness-110
    disabled:opacity-60
    disabled:cursor-not-allowed
  `}
>
  {isSubmitting ? (
    <Loader2 className="w-5 h-5 animate-spin" />
  ) : (
    <Send className="w-5 h-5" />
  )}
</button>


        </div>
      )}
    </>
  );
};

export default StoryReplies;

