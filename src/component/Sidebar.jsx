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

  // Auto-resize logic
React.useEffect(() => {
  const handleResize = () => {
    console.log("Resize event:", window.innerWidth);
    if (window.innerWidth >= activeWidth) {
      console.log("Setting sidebarOpen = true (desktop)");
      setSidebarOpen(true);
    } else {
      console.log("Setting sidebarOpen = false (mobile)");
      setSidebarOpen(false);
    }
  };
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, [setSidebarOpen]);


  // Auto-hide sidebar on mobile when route changes
React.useEffect(() => {
  console.log("Route changed:", location.pathname, "sidebarOpen:", sidebarOpen);
  if (window.innerWidth < activeWidth && sidebarOpen &&prevPath.current !== location.pathname) {
    console.log("Auto-closing sidebar due to route change");
    setSidebarOpen(false);
  }
  prevPath.current = location.pathname;
}, [location.pathname, sidebarOpen, setSidebarOpen]);


  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && window.innerWidth < activeWidth && (
        <div
          className="fixed inset-0 bg-black/50 z-94440"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div
        ref={ref}
        className={`fixed top-0 left-0 z-99440 h-screen w-52 md:w-56 lg:w-60 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className="h-full flex flex-col justify-between"
          style={{
            backgroundColor: "var(--form-bg)",
            borderRight: "1px solid var(--input-border)",
            color: "var(--text-main)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {/* Mobile close button */}
          <X
            className="absolute top-3 right-3 w-8 h-8 p-1.5 rounded-md text-gray-700 bg-white shadow-md sm:hidden cursor-pointer hover:bg-gray-100 transition"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Logo + menu items */}
          <div className="w-full px-4 pt-4 pb-6 flex-1">
            <img
              onClick={() => navigate("/")}
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

          {/* User profile */}
          <div className="w-full border-t border-[var(--input-border)] p-4 px-7">
            <UserProfileButton user={user} />
          </div>
        </div>
      </div>
    </>
  );
});

export default Sidebar;
