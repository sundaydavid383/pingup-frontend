// src/component/RightSidebar.jsx
import React from "react";
import RecentMessages from "./RecentMessages";
import RightSidebarSkeleton from "./skeleton/RightSidebarSkeleton";

const RightSidebar = ({ sponsors, loading }) => {
  return (
    <aside className="hidden lg:flex flex-col w-[330px] shrink-0 gap-4 h-[full] sticky top-0 overflow-y-auto pt-2 p-4 ml-6 mr-1">

      {/* Loading State */}
      {loading && <RightSidebarSkeleton />}

      {/* Sponsor Ad */}
      {!loading && sponsors && (
        <a
          href={sponsors.link}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-2  text-xs rounded-md shadow hover:scale-101 hover:shadow-lg transition-transform duration-300 ease-in-out"
        >
          <h3 className="text-slate-900 font-semibold mb-2">{sponsors.title}</h3>

          <img
            src={sponsors.image}
            alt={sponsors.brand}
            className="w-full h-auto rounded-md mb-2 object-contain"
          />

          <p className="text-slate-600 font-medium px-2">{sponsors.brand}</p>
          <p className="text-slate-600 p-1">{sponsors.description}</p>
        </a>
      )}

      {/* Recent Messages */}
      {!loading && <RecentMessages />}
    </aside>
  );
};

export default RightSidebar;
