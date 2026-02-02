import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import assets from "../assets/assets";
import "../styles/ui.css";
import { useRef } from "react";
import MenuItems from "./MenuItems";
import { CirclePlus, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import UserProfileButton from "./UserProfileButton";

const Sidebar = React.forwardRef(({ sidebarOpen, setSidebarOpen }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, unreadCount } = useAuth();
  const prevPath = useRef(location.pathname);
  const activeWidth = 658;

  // Determine if the sidebar should be in "icon-only" mode
  const isMessageTab = location.pathname.startsWith('/messages');

  // Effect 1: Handle Screen Resizing
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true); 
      } else {
        setSidebarOpen(false); 
      }
    };
    
    // Set initial state on mount
    handleResize(); 
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  // Effect 2: Close sidebar ONLY when the route changes on mobile
  // Removed 'sidebarOpen' from dependencies to prevent auto-closing when toggled
  React.useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname, setSidebarOpen]);

  return (
    <>
      {/* Overlay for mobile view */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black/50 z-[40] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div
        className={`fixed top-0 left-0 z-[50] flex flex-col justify-between
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isMessageTab ? 'w-20' : 'w-52 md:w-56 lg:w-60'} 
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
        {/* Close button for mobile */}
        <X
          className="absolute top-3 right-3 w-8 h-8 p-1.5 rounded-md text-gray-700 bg-white shadow-md md:hidden cursor-pointer hover:bg-gray-100 transition"
          onClick={() => setSidebarOpen(false)}
        />

        <div className={`w-full pt-4 pb-6 flex-1 flex flex-col ${isMessageTab ? 'items-center px-2' : 'px-4'}`}>
          <img
            onClick={() => navigate('/')}
            src={assets.logo}
            alt="Logo"
            className={`cursor-pointer mb-3 transition-all ${isMessageTab ? 'w-8' : 'w-20'}`}
          />
          <hr className="border-[var(--input-border)] mb-3 w-full" />

          <MenuItems unreadCount={unreadCount} setSidebarOpen={setSidebarOpen} />

          <Link
            to="/create-post"
            className={`btn mt-5 flex gap-2 justify-center items-center bg-[var(--primary)] text-white rounded-lg transition-all
              ${isMessageTab ? 'w-10 h-10 p-0' : 'w-full py-2.5 px-4'}
            `}
          >
            <CirclePlus className="w-5 h-5 shrink-0" />
            {!isMessageTab && <span>Create Post</span>}
          </Link>
        </div>

        <div className={`w-full border-t border-[var(--input-border)] py-4 ${isMessageTab ? 'px-2 flex justify-center' : 'px-7'}`}>
          <UserProfileButton user={user} isCollapsed={isMessageTab} />
        </div>
      </div>
    </>
  );
});

export default Sidebar;
