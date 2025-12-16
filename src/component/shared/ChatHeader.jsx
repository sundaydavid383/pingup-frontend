const ChatHeader = ({ receiver }) => {
  if (!receiver) return null;

  const isOnline = onlineUsers.has(receiver._id);

  return (
    <div className="fixed top-0 left-0 right-0 flex items-center gap-3 p-3 bg-multi-gradient text-white justify-between z-50">
      <div className="flex items-center gap-3">
        <div
          onClick={() => navigate(`/profile/${receiver._id}`)}
          className="cursor-pointer title"
        >
          <ProfileAvatar user={receiver} size={48} />
        </div>
        <div>
          <p className="font-medium text-sm sm:text-base text-[var(--input-primary)]">
            {receiver.username}
          </p>
          <span className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
      {/* Theme picker */}
      <ThemeDropdown containerRef={chatContainerRef} />
    </div>
  );
};
