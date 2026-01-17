<<<<<<< HEAD
import React, { useEffect, useRef } from "react";
import Sidebar from "../component/Sidebar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Loading from "../component/shared/Loading";
=======
import React from 'react';
import Sidebar from '../component/Sidebar';
import { Outlet, useLocation } from 'react-router-dom'; // Added useLocation
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Loading from '../component/shared/Loading';
>>>>>>> d54218d (Refactor chat UI: fixed scroll behavior, static header/input, media & theme updates)
import MobileNavbar from "../component/shared/MobileNavbar";
import "../component/shared/mobilenavbar.css";

const Layout = () => {
  const { user, sidebarOpen, setSidebarOpen } = useAuth();
<<<<<<< HEAD
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const activeWidth = 658;
  const mode = import.meta.env.MODE;
  const testLayout = false
  // Handle clicks outside sidebar (only on mobile)
useEffect(() => {
  const handleClickOutside = (event) => {
    if (mode === "development" && testLayout) {
    console.log("handleClickOutside fired:", {
    
      sidebarOpen,
      target: event.target,
      sidebarContains: sidebarRef.current?.contains(event.target),
      menuButtonContains: menuButtonRef.current?.contains(event.target),
    });
    console.log("Window width:", window.innerWidth);
  }
=======
  const location = useLocation();

  // Detect if we are on the messages page to match Sidebar's mini-width
  const isMessageTab = location.pathname.startsWith('/messages');
>>>>>>> d54218d (Refactor chat UI: fixed scroll behavior, static header/input, media & theme updates)

    if (window.innerWidth >= activeWidth) return;
    if (!sidebarOpen) return;
    if (!sidebarRef.current || !menuButtonRef.current) return;
    if (sidebarRef.current?.contains(event.target)) return;
    if (menuButtonRef.current?.contains(event.target)) return;

    console.log("Closing sidebar due to outside click");
    setSidebarOpen(false);
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [sidebarOpen, setSidebarOpen]);


  if (!user) return <Loading />;

  return (
    <div className="w-full flex h-screen relative no-scrollbar overflow-x-hidden">
      {/* Sidebar */}
      
      <Sidebar
        ref={sidebarRef}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Mobile Navbar (optional) */}
      <MobileNavbar setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div
<<<<<<< HEAD
        className={`flex-1 bg-slate-50 transition-all duration-300 ${
          sidebarOpen ? "ml-52 md:ml-56 lg:ml-60" : "ml-0"
        } mobilenav_intervention`}
=======
        className={`flex-1 bg-slate-50 transition-all duration-300
          ${
            sidebarOpen 
              ? isMessageTab 
                ? 'ml-20' // Matches Sidebar reduced width
                : 'ml-52 md:ml-56 lg:ml-60' // Matches Sidebar full width
              : 'ml-0'
          } mobilenav_intervention`}
>>>>>>> d54218d (Refactor chat UI: fixed scroll behavior, static header/input, media & theme updates)
      >
        <Outlet />
      </div>

<<<<<<< HEAD
      {/* Menu Button (mobile only, <650px) */}
      {window.innerWidth < activeWidth && !sidebarOpen && (
       <Menu
  ref={menuButtonRef}
  className="fixed top-1 left-1 z-50 bg-white rounded-md shadow w-10 h-10 p-2 text-gray-600 cursor-pointer"
  onClick={() => {
    console.log("Menu button clicked. sidebarOpen:", sidebarOpen);
    setSidebarOpen(true);
  }}
/>

=======
      {/* Show toggle only on small screens */}
      {!sidebarOpen && (
        <Menu
          className="fixed top-1 left-1 z-[50] bg-white rounded-md shadow w-10 h-10 p-2 text-gray-600 md:hidden cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        />
>>>>>>> d54218d (Refactor chat UI: fixed scroll behavior, static header/input, media & theme updates)
      )}
    </div>
  );
};

export default Layout;