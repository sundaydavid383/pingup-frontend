import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Members', href: '/admin/members' },
  { label: 'Posts & Content', href: '/admin/posts' },
  { label: 'Flagged Content', href: '/admin/flagged' },
  { label: 'Bible Study Groups', href: '/admin/groups' },
  { label: 'Prayer Requests', href: '/admin/prayers' },
  { label: 'Devotionals', href: '/admin/devotionals' },
  { label: 'Announcements', href: '/admin/announcements' },
  { label: 'Reports', href: '/admin/reports' },
  { label: 'Notifications', href: '/admin/notifications' },
  { label: 'Settings', href: '/admin/settings' },
];

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 lg:hidden">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsOpen(false)}></div>}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 lg:w-64 bg-[#1e40af] z-40 transform transition-transform duration-300 overflow-y-auto lg:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-[#3b82f6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#1e40af] font-bold text-lg">SC</span>
            </div>
            <div>
              <div className="text-white font-bold">SpringsCircle</div>
              <div className="text-[#93c5fd] text-xs">Admin</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="py-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-[#1e40af] font-semibold border-r-4 border-white'
                    : 'text-white hover:bg-[#3b82f6]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Admin Avatar at bottom */}
        <div className="absolute bottom-6 left-6 right-6 pt-6 border-t border-[#3b82f6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#1e40af] font-bold">MO</span>
            </div>
            <div className="text-white">
              <div className="text-sm font-semibold">Pastor Mike</div>
              <div className="text-[#93c5fd] text-xs">Super Admin</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
