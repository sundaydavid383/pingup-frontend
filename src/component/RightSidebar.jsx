// src/component/RightSidebar.jsx
import React from "react";
import RecentMessages from "./RecentMessages";
import RightSidebarSkeleton from "./skeleton/RightSidebarSkeleton";
import "../styles/sponsor.css";
const RightSidebar = ({ sponsors, loading }) => {
  return (
<aside className="
  hidden lg:flex
  w-[330px]
  pt-2 p-4 ml-6 mr-1 
">
  <div className="fixed top-0 right-0 flex-col
  w-[330px] shrink-0 gap-2
  max-h-[98vh] overflow-y-auto
  pt-2 p-4 ml-6 mr-1 no-scrollbar">

      {/* Loading State */}
      {loading && <RightSidebarSkeleton />}

      {/* Sponsor Ad */}
      {!loading && sponsors && (
        <a
          href={sponsors.link}
          target="_blank"
          rel="noopener noreferrer"
          className="sponsor block mb-6 hover:scale-105 hover:shadow-lg transition-transform duration-300"
        >
          <h3 className="text-slate-900 font-semibold mb-2">{sponsors.title}</h3>

          <img
            src={sponsors.image}
            alt={sponsors.brand}
            className="w-full h-auto rounded-md mb-2 object-contain"
          />

          <p className="text-slate-600 font-medium px-2">{sponsors.brand}</p>
          <p className="text-slate-600 text-[0.8rem] p-1">{sponsors.description}</p>
        </a>
      )}

      {/* Recent Messages */}
      {!loading && <RecentMessages />}
      </div>
    </aside>
  );
};

export default RightSidebar;
