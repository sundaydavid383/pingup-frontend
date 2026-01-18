import React, { useRef, useEffect } from "react";
import Sidebar from "../component/Sidebar";
import { Outlet, useLocation } from "react-router-dom"; // useLocation is already in the recent commit
import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Loading from "../component/shared/Loading";
import MobileNavbar from "../component/shared/MobileNavbar";
import "../component/shared/mobilenavbar.css";

const LEFT_SIDEBAR_WIDTH = 240; // adjust if your Sidebar width differs

const Layout = () => {
  const { user, sidebarOpen, setSidebarOpen } = useAuth();
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const location = useLocation();

  // Detect if we are on messages page (mini sidebar width)
  const isMessageTab = location.pathname.startsWith("/messages");
  const activeWidth = 658;

  // Close sidebar on outside click (mobile only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth >= activeWidth) return;
      if (!sidebarOpen) return;
      if (!sidebarRef.current || !menuButtonRef.current) return;
      if (sidebarRef.current.contains(event.target)) return;
      if (menuButtonRef.current.contains(event.target)) return;

      setSidebarOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen, setSidebarOpen]);

  if (!user) return <Loading />;

  return (
    <div className="w-full flex h-screen relative overflow-x-hidden">
      {/* Left Sidebar */}
      <Sidebar
        ref={sidebarRef}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div
        className="flex-1 h-full overflow-y-auto bg-slate-50 transition-all duration-300"
        style={{
          marginLeft: sidebarOpen
            ? isMessageTab
              ? 80
              : LEFT_SIDEBAR_WIDTH
            : 0,
        }}
      >
        <Outlet />
      </div>

      {/* Mobile Navbar */}
      <MobileNavbar setSidebarOpen={setSidebarOpen} />

      {/* Mobile Menu Button */}
      {!sidebarOpen && (
        <Menu
          ref={menuButtonRef}
          className="fixed top-1 left-1 z-[50] bg-white rounded-md shadow w-10 h-10 p-2 text-gray-600 md:hidden cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        />
      )}
    </div>
  );
};

export default Layout;
