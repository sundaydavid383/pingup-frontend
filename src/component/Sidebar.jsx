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

  // ✅ Keep sidebar open automatically when screen >= 768px
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  // ❌ Removed the effect that auto-hides sidebar when pathname changes

  return (
<div
  className={`fixed top-0 left-0 z-[999999999] flex flex-col justify-between
    transition-transform duration-300 ease-in-out
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    w-52 md:w-56 lg:w-60 h-screen`}
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
        className="absolute top-3 right-3 w-8 h-8 p-1.5 rounded-md text-gray-700 bg-white shadow-md sm:hidden cursor-pointer hover:bg-gray-100 transition"
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
  );
};

export default Sidebar;