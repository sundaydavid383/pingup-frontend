import React from 'react';
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

  // Detect if we are on the messages page to match Sidebar's mini-width
  const isMessageTab = location.pathname.startsWith('/messages');

  return user ? (
    <div className="w-full flex h-screen relative no-scrollbar overflow-x-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <MobileNavbar setSidebarOpen={setSidebarOpen} />

      <div
        className={`flex-1 bg-slate-50 transition-all duration-300
          ${
            sidebarOpen 
              ? isMessageTab 
                ? 'ml-20' // Matches Sidebar reduced width
                : 'ml-52 md:ml-56 lg:ml-60' // Matches Sidebar full width
              : 'ml-0'
          } mobilenav_intervention`}
      >
        <Outlet />
      </div>

      {/* Show toggle only on small screens */}
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