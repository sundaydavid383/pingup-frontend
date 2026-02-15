import { useEffect, useRef } from "react";
import {
  MessageCircle,
  Copy,
  Trash2,
  MoreHorizontal
} from "lucide-react";

const MessageOptionsDropdown = ({
  message,
  position,
  onClose,
  onReply,
  onCopy,
  onDelete,
  sentByUser,
}) => {
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Handle escape key
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Prevent context menu from appearing
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleReply = () => {
    onReply(message);
    onClose();
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.text || "");
    }
    onClose();
  };

  const handleDeleteForMe = () => {
    // Delete for me only - passes false as second parameter
    if (onDelete) {
      onDelete(message._id, false);
    }
    onClose();
  };

  const handleDeleteForEveryone = () => {
    // Delete for everyone - passes true as second parameter
    if (onDelete) {
      onDelete(message._id, true);
    }
    onClose();
  };

  if (!position) return null;

  return (
    <>
      {/* Blurred backdrop - WhatsApp style focus */}
      <div
        className="fixed inset-0 z-[999998] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dropdown menu */}
      <div
        ref={dropdownRef}
        onContextMenu={handleContextMenu}
        className="fixed z-[999999] bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-150"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -100%)",
        }}
      >
        {/* Arrow pointing to message */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 
            border-l-[8px] border-l-transparent 
            border-r-[8px] border-r-transparent 
            border-t-[8px] border-t-white dark:border-t-gray-800"
        />

        <button
          onClick={handleReply}
          className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <MessageCircle size={18} />
          <span>Reply</span>
        </button>

        <button
          onClick={handleCopy}
          className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Copy size={18} />
          <span>Copy</span>
        </button>

        <button
          onClick={handleDeleteForMe}
          className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-600 
              hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={18} />
          <span>Delete for me</span>
        </button>

        {sentByUser && (
          <button
            onClick={handleDeleteForEveryone}
            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-600 
                hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={18} />
            <span>Delete for everyone</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <MoreHorizontal size={18} />
          <span>More</span>
        </button>
      </div>
    </>
  );
};

export default MessageOptionsDropdown;
