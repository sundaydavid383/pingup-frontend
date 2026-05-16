import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import assets from "../assets/assets";
import "../styles/ui.css";
import "../styles/sidebar-award.css"; // ← ADD THIS IMPORT
import MenuItems from "./MenuItems";
import { CirclePlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import UserProfileButton from "./UserProfileButton";
import { useSidebarTooltip } from "./shared/SidebarTooltipPortal";

const Sidebar = React.forwardRef(({ sidebarOpen, setSidebarOpen }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showTooltip, hideTooltip } = useSidebarTooltip();

  const isMessageTab   = location.pathname.startsWith('/messages');
  const isSettingsTab  = location.pathname.startsWith('/settings');
  const isDiscoveriesTab = location.pathname.startsWith('/discover');
  const isProfileTab   = location.pathname.startsWith('/profile') || location.pathname === '/profile';
  
  const onlyIconPage = isMessageTab || isSettingsTab || isDiscoveriesTab || isProfileTab;
  const paradigmShift = 635;

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= paradigmShift) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  React.useEffect(() => {
    if (window.innerWidth < paradigmShift) {
      setSidebarOpen(false);
    }
  }, [location.pathname, setSidebarOpen]);

  const handleCreatePostMouseEnter = (e) => {
    if (onlyIconPage && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      showTooltip("Create Post", rect.right, rect.top + rect.height / 2);
    }
  };

  return (
    <>
      {/* ── Mobile overlay — enhanced with backdrop blur ── */}
      {sidebarOpen && window.innerWidth < paradigmShift && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR SHELL ── */}
      <div
        ref={ref}
        className={`
          fixed top-0 left-0 z-[500] flex flex-col
          transition-all duration-300 ease-in-out
          sidebar-container
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${onlyIconPage ? 'w-20' : 'w-52 md:w-56 lg:w-60'}
          h-screen overflow-hidden
        `}
      >
        {/* Aurora decorative blob */}
        <div className="sidebar-aurora-blob" />

        {/* ── LOGO ── */}
        <div className="sidebar-logo-zone">
          <img
            onClick={() => navigate('/')}
            src={assets.logo}
            alt="Logo"
            className={`logo cursor-pointer mb-0 transition-all ${onlyIconPage ? 'w-25 h-8' : 'w-20 h-10'}`}
          />
        </div>

        {/* Prismatic shimmer divider */}
        <hr className="sidebar-hr" />

        {/* ── NAV ITEMS ── */}
        <div className={`w-full pt-0 pb-2 flex-1 flex flex-col overflow-y-auto no-scrollbar ${onlyIconPage ? 'items-center px-2' : 'px-2'}`}>
          <MenuItems setSidebarOpen={setSidebarOpen} />

          {/* Create Post CTA */}
          <Link
            to="/create-post"
            className={`create-post ${onlyIconPage ? 'icon-only' : 'w-full'} mt-3`}
            onMouseEnter={handleCreatePostMouseEnter}
            onMouseLeave={hideTooltip}
          >
            <CirclePlus className="w-5 h-5 shrink-0" />
            {!onlyIconPage && <span>Create Post</span>}
          </Link>
        </div>

        {/* ── USER PROFILE FOOTER ── */}
        <div className={`sidebar-footer ${onlyIconPage ? 'flex justify-center' : ''}`}>
          <UserProfileButton
            user={user}
            isCollapsed={onlyIconPage}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
        </div>
      </div>
    </>
  );
});

export default Sidebar;