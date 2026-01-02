import React from 'react';  
import { Link, useNavigate, useLocation } from 'react-router-dom';
import assets from '../assets/assets';
import "../styles/ui.css";
import MenuItems from './MenuItems';
import { CirclePlus, X } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import UserProfileButton from './UserProfileButton';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, unreadCount } = useAuth();

  // 1. Logic for Screen Resizing
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true); // Always show on Desktop
      } else {
        setSidebarOpen(false); // Hide by default on Mobile/Tablet
      }
    };
    
    handleResize(); // Run on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  // 2. Logic to auto-hide sidebar on Mobile when navigation occurs
  React.useEffect(() => {
    if (window.innerWidth < 768 && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname]); // Triggers every time the URL changes

  return (
    <>
      {/* Background Overlay for Mobile: Closes sidebar when clicking outside */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black/50 z-[40] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 z-[50] flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          w-52 md:w-56 lg:w-60
          h-screen
        `}
        style={{
          backgroundColor: 'var(--form-bg)',
          borderRight: '1px solid var(--input-border)',
          color: 'var(--text-main)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Mobile Close Button */}
        <X
          className="absolute top-3 right-3 w-8 h-8 p-1.5 rounded-md text-gray-700 bg-white shadow-md md:hidden cursor-pointer hover:bg-gray-100 transition"
          onClick={() => setSidebarOpen(false)}
        />

        <div className="w-full px-4 pt-4 pb-6 flex-1">
          <img
            onClick={() => navigate('/')}
            src={assets.logo}
            alt="Logo"
            className="w-20 cursor-pointer mb-3"
          />
          <hr className="border-[var(--input-border)] mb-3" />

          {/* Pass setSidebarOpen to MenuItems if needed for individual clicks */}
          <MenuItems unreadCount={unreadCount} setSidebarOpen={setSidebarOpen} />

          <Link
            to="/create-post"
            className="btn w-full mt-5 flex gap-2 justify-center items-center bg-[var(--primary)] text-white rounded-lg py-2.5 hover:opacity-90 transition"
          >
            <CirclePlus className="w-5 h-5" />
            <span>Create Post</span>
          </Link>
        </div>

        <div className="w-full border-t border-[var(--input-border)] p-4 px-7">
          <UserProfileButton user={user} />
        </div>
      </div>
    </>
  );
};

export default Sidebar;