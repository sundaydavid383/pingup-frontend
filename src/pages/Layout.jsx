import {useEffect} from 'react';
import Sidebar from '../component/Sidebar';
import { Outlet, useLocation } from 'react-router-dom'; // Added useLocation
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Loading from '../component/shared/Loading';
import MobileNavbar from "../component/shared/MobileNavbar";
import "../component/shared/mobilenavbar.css";

const Layout = () => {
  const { user, sidebarOpen, setSidebarOpen } = useAuth();
  const location = useLocation();

  // Detect if we are on the messages, profile, or settings page to match Sidebar's mini-width
  const isMessageTab = location.pathname.startsWith('/messages');
  const isSettingsTab = location.pathname.startsWith('/settings');
  const isProfileTab = location.pathname.startsWith('/profile') || location.pathname === '/profile';
  const isBibleTab = location.pathname.startsWith('/bible');
  const isDiscoverTab = location.pathname.startsWith('/discover') || location.pathname === '/discover';
  // Hide mobile navbar on messages, chatbox, profile, and settings pages
  const hideMobileNavbar = location.pathname.startsWith('/messages') || location.pathname.startsWith('/chatbox') || location.pathname.startsWith('/settings') || location.pathname.startsWith('/bible') || location.pathname.startsWith('/discover') || location.pathname.startsWith('/profile');
  useEffect(() => {
    console.log(sidebarOpen, "sidebarOpen in Layout");
  }, [sidebarOpen]);

return user ? (
  <div className="w-full h-screen relative no-scrollbar overflow-hidden">
    <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    {!hideMobileNavbar && <MobileNavbar setSidebarOpen={setSidebarOpen} />}

    <div
  className={`absolute top-0 right-0 bottom-0 overflow-y-auto bg-slate-50
    ${!hideMobileNavbar ? 'mobilenav_intervention' : 'pt-0'}`}
  style={{
    isolation: 'isolate',
    left: sidebarOpen
      ? (isMessageTab || isSettingsTab || isProfileTab || isDiscoverTab)
        ? 'var(--sidebar-icon-width)'
        : 'var(--sidebar-full-width)'
      : '0',
    transition: 'left 300ms ease-in-out'
  }}
>
  <Outlet />
</div>

    {!sidebarOpen && (
      <Menu
        className="fixed top-1 left-1 z-[50] bg-white rounded-md shadow w-10 h-10 p-2 text-gray-600 md:hidden cursor-pointer"
        onClick={() => setSidebarOpen(true)}
      />
    )}
  </div>
) : (
  <Loading />
);
};

export default Layout;