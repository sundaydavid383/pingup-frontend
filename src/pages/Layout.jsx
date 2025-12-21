import React, { useState } from 'react';
import Sidebar from '../component/Sidebar';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Loading from '../component/shared/Loading';
import MobileNavbar from "../component/shared/MobileNavbar";
import "../component/shared/mobilenavbar.css"

const Layout = () => {
  const { user, sidebarOpen, setSidebarOpen } = useAuth();

  return user ? (
    <div className="w-full flex min-h-screen relative no-scrollbar overflow-x-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <MobileNavbar setSidebarOpen={setSidebarOpen} />

      <div
        className={`flex-1 bg-slate-50 transition-all duration-300 min-h-screen overflow-y-auto
          ${sidebarOpen ? 'md:ml-56 lg:ml-60' : 'md:ml-0'} mobilenav_intervention` }
      >
        <Outlet />
      </div>

      {/* Show toggle only on small screens */}
      {!sidebarOpen && (
        <Menu
          className="fixed top-1 left-1 z-55550 bg-white rounded-md shadow w-10 h-10 p-2 text-gray-600 md:hidden cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        />
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default Layout;
