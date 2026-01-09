import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ActionNotifier from './shared/ActionNotifier';
import ProfileAvatar from "../component/shared/ProfileAvatar";



const UserProfileButton = () => {
  const { user, setModalOpen, logout } = useAuth();
  const [showNotifier, setShowNotifier] = useState(false);

  const handleLogoutClick = () => setShowNotifier(true);
  const handleConfirm = () => { logout(); setShowNotifier(false); };
  const handleCancel = () => setShowNotifier(false);

  const getFirstLetterOfNameForFallbackAvatar = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-center justify-between w-full p-2">
      
      {/* Profile (Clickable Area) */}
<div className="flex items-center gap-3 cursor-pointer min-w-0">
 <div className="w-5"> <ProfileAvatar
    user={user}
    size={40} // double size
    className="flex-shrink-0 flex-grow-0 m-3" // prevents squashing
  /></div>

  <div className="flex flex-col overflow-hidden min-w-0 ml-3">
    <p className="text-sm font-semibold truncate text-[var(--text-main)] capitalize">
      {user.name}
    </p>
    <p className="text-xs text-[var(--text-secondary)] truncate">
      {user.email}
    </p>
  </div>
</div>



      {/* Logout Icon */}
      <button
        onClick={handleLogoutClick}
        title="Logout"
        className="text-[var(--text-secondary)] hover:text-[var(--text-main)] transition duration-200 ml-3 flex-shrink-0"
      >
        <LogOut className="w-5 h-5" />
      </button>

      {/* ActionNotifier Modal */}
      {showNotifier && (
        <ActionNotifier
          action="logout"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default UserProfileButton;