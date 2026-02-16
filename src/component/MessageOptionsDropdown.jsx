import { useEffect, useRef } from "react";
import {
  MessageCircle,
  Copy,
  Trash2,
  MoreHorizontal
} from "lucide-react";

const MessageOptionsDropdown = ({
  message,
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

  // Always center the dropdown on the screen
  const centeredPosition = {
    x: '50%',
    y: '50%'
  };

  return (
    <>
      {/* Blurred backdrop - focus on the dropdown */}
      <div
        className="fixed inset-0 z-[999998] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dropdown menu - always centered on screen */}
      <div
        ref={dropdownRef}
        onContextMenu={handleContextMenu}
        className="fixed z-[999999] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl py-3 min-w-[220px] animate-in fade-in zoom-in-95 duration-200"
        style={{
          left: centeredPosition.x,
          top: centeredPosition.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Title */}
        <div className="px-4 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Message Options
          </p>
        </div>

        <button
          onClick={handleReply}
          className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 
            hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-lg mx-1"
        >
          <MessageCircle size={18} className="text-blue-500" />
          <span>Reply</span>
        </button>

        <button
          onClick={handleCopy}
          className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg mx-1"
        >
          <Copy size={18} className="text-gray-500" />
          <span>Copy</span>
        </button>

        <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />

        <button
          onClick={handleDeleteForMe}
          className="w-full px-4 py-3 flex items-center gap-3 text-sm text-red-600 
              hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg mx-1"
        >
          <Trash2 size={18} />
          <span>Delete for me</span>
        </button>

        {sentByUser && (
          <button
            onClick={handleDeleteForEveryone}
            className="w-full px-4 py-3 flex items-center gap-3 text-sm text-red-600 
                hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg mx-1"
          >
            <Trash2 size={18} />
            <span>Delete for everyone</span>
          </button>
        )}

        <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />

        <button
          onClick={onClose}
          className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg mx-1"
        >
          <MoreHorizontal size={18} className="text-gray-400" />
          <span>More</span>
        </button>
      </div>
    </>
  );
};

export default MessageOptionsDropdown;
