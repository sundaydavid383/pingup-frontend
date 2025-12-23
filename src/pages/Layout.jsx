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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth > 768) return;

      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        sidebarOpen
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, setSidebarOpen]);

  if (!user) return <Loading />;

  return (
    <div className="w-full flex min-h-screen relative no-scrollbar overflow-x-hidden">
      <div ref={sidebarRef}>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      <MobileNavbar setSidebarOpen={setSidebarOpen} />

      <div
        className={`flex-1 bg-slate-50 transition-all duration-300 min-h-screen overflow-y-auto
          ${sidebarOpen ? 'ml-52 md:ml-56 lg:ml-60' : 'ml-0'} mobilenav_intervention`}
      >
        <Outlet />
      </div>

      {!sidebarOpen && (
        <Menu
          className="fixed top-1 left-1 z-55550 bg-white rounded-md shadow w-10 h-10 p-2 text-gray-600 md:hidden cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        />
      )}
    </div>
  );
};

export default Layout;
