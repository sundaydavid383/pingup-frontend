import { useState, useRef, useEffect } from "react";
import { Megaphone, X } from "lucide-react";
import RecentMessages from "../RecentMessages";

const MediumSidebarToggle = ({ sponsors }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef(null);
  const buttonRef = useRef(null);

  // Close sidebar if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showSidebar &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setShowSidebar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSidebar]);

  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 z-[555] bg-white shadow-lg w-[300px] p-2 h-screen overflow-y-auto transform transition-transform duration-300 ease-in-out md:block lg:hidden ${
          showSidebar ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {sponsors && (
          <a
            href={sponsors.link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-xs p-4 rounded-md shadow-sm hover:shadow-lg transition-transform duration-300 ease-in-out block"
          >
            <h3 className="text-slate-800 font-semibold mb-2">
              {sponsors.title}
            </h3>
            <img
              src={sponsors.image}
              alt={sponsors.brand}
              className="w-full h-auto rounded-md mb-2 object-contain"
            />
            <p className="text-slate-600 font-medium">{sponsors.brand}</p>
            <p className="text-slate-600">{sponsors.description}</p>
          </a>
        )}

        <RecentMessages />
      </div>

      {/* Toggle button */}
      <button
        ref={buttonRef}
        onClick={() => setShowSidebar(!showSidebar)}
        className="flex lg:hidden fixed top-1 z-555 right-1 bg-white p-2 rounded-full transition duration-300"
        style={{ boxShadow: "0 4px 10px var(--primary)" }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "none")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.boxShadow = "0 4px 10px var(--primary)")
        }
      >
        {!showSidebar ? (
          <Megaphone size={20} className="text-slate-700" />
        ) : (
          <X size={20} className="text-slate-700" />
        )}
      </button>
    </>
  );
};

export default MediumSidebarToggle;
