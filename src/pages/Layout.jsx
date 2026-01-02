import React, { useEffect, useRef } from 'react';
import Sidebar from '../component/Sidebar';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Loading from '../component/shared/Loading';
import MobileNavbar from "../component/shared/MobileNavbar";
import "../component/shared/mobilenavbar.css";

const Layout = () => {
  const { user, sidebarOpen, setSidebarOpen } = useAuth();
  const sidebarRef = useRef(null);
const menuButtonRef = useRef(null);


useEffect(() => {
  const handleClickOutside = (event) => {
    if (window.innerWidth > 768) return;
    if (!sidebarOpen) return;

    if (sidebarRef.current?.contains(event.target)) return;
    if (menuButtonRef.current?.contains(event.target)) return;

    setSidebarOpen(false);
  };

  document.addEventListener("pointerdown", handleClickOutside);

  return () => {
    document.removeEventListener("pointerdown", handleClickOutside);
  };
}, [sidebarOpen, setSidebarOpen]);




  if (!user) return <Loading />;

  return (
 <div className="w-full flex h-screen relative no-scrollbar overflow-x-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <MobileNavbar setSidebarOpen={setSidebarOpen} />

      <div
        className={`flex-1 bg-slate-50 transition-all duration-300
          ${sidebarOpen ? 'ml-52 md:ml-56 lg:ml-60' : 'ml-0'} mobilenav_intervention`}
      >
        <Outlet />
      </div>

      {/* Show toggle only on small screens */}
   {!sidebarOpen && (
  <Menu
    ref={menuButtonRef}
    className="fixed top-1 left-1 z-55550 bg-white rounded-md shadow w-10 h-10 p-2 text-gray-600 sm:hidden cursor-pointer"
    onClick={() => setSidebarOpen(true)}
  />
)}

    </div>
  ) 
};

export default Layout;
