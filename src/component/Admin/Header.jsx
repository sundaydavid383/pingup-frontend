import React, { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

const Header = ({ title }) => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between h-20 px-6 lg:px-8">
        {/* Left side - Page title */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>

        {/* Right side - Search, notifications, profile */}
        <div className="flex items-center gap-6">
          {/* Search bar */}
          <div className="hidden lg:flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-sm w-48"
            />
          </div>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-lg"
            >
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200 font-semibold">Notifications</div>
                <div className="max-h-96 overflow-y-auto">
                  {[
                    { id: 1, message: 'New post flagged for review', time: '5 min ago' },
                    { id: 2, message: 'John mentioned you in a comment', time: '1 hour ago' },
                    { id: 3, message: 'System maintenance scheduled', time: '3 hours ago' },
                  ].map((notif) => (
                    <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
                      <p className="text-sm text-gray-900">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <div className="w-8 h-8 bg-[#1e40af] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                MO
              </div>
              <ChevronDown size={18} className="text-gray-600" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">Pastor Mike Osei</p>
                  <p className="text-xs text-gray-500">mike@example.com</p>
                </div>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                  Profile Settings
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                  Preferences
                </button>
                <div className="border-t border-gray-200 px-4 py-2">
                  <button className="w-full text-left text-sm text-red-600 hover:text-red-700">
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
